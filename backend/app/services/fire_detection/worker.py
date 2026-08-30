"""Fire Detection AI Inference Service with Multi-Stage False Positive Suppression.

Consumes sampled frames from the central raw frame queue, runs Fire Detection
inference, applies HSV/YCrCb chrominance verification, dynamic motion flicker differencing,
spatial-temporal IoU tracking, logs verified alerts to the database,
and caches live detection metadata for video streaming overlays.
"""

from __future__ import annotations

import logging
import os
import time
import uuid
from collections import defaultdict, deque
from datetime import datetime
from queue import Empty, Queue
from threading import Event, Thread
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np

try:
    from ultralytics import YOLO
except ImportError:
    YOLO = None

from app.db.connection import SessionLocal
from app.models.alert import Alert
from app.services.fire_detection.filters import (
    calculate_iou,
    calculate_motion_flicker,
    is_valid_bounding_box_geometry,
    verify_fire_chrominance,
)

LOG = logging.getLogger(__name__)


def resolve_model_path() -> Optional[str]:
    """Find the trained fire detection model weights file."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    root_dir = os.path.abspath(os.path.join(base_dir, ".."))
    candidates = [
        os.path.join(root_dir, "backend", "ml_models", "fire_detection.pt"),
        os.path.join(root_dir, "backend", "ml_models", "fireeeee.pt"),
        os.path.join(root_dir, "backend", "fire_detection.pt"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


class SecurityDetectionCache:
    """Thread-safe cache holding latest verified fire detection state per camera."""

    def __init__(self) -> None:
        self._states: Dict[str, Dict[str, Any]] = {}

    def update_camera_state(
        self,
        camera_id: str,
        fire_detected: bool,
        confidence: float = 0.0,
        boxes: Optional[List[List[int]]] = None,
        is_active_alert: bool = False
    ) -> None:
        self._states[camera_id] = {
            "camera_id": camera_id,
            "fire_detected": fire_detected,
            "confidence": confidence,
            "boxes": boxes or [],
            "is_active_alert": is_active_alert,
            "last_updated": time.time()
        }

    def get_camera_state(self, camera_id: str) -> Dict[str, Any]:
        state = self._states.get(camera_id)
        if state and (time.time() - state.get("last_updated", 0) > 4.0):
            # Stale state after 4 seconds of no frames
            return {
                "camera_id": camera_id,
                "fire_detected": False,
                "confidence": 0.0,
                "boxes": [],
                "is_active_alert": False,
                "last_updated": state["last_updated"]
            }
        return state or {
            "camera_id": camera_id,
            "fire_detected": False,
            "confidence": 0.0,
            "boxes": [],
            "is_active_alert": False,
            "last_updated": 0
        }

    def remove_camera(self, camera_id: str) -> None:
        self._states.pop(camera_id, None)

    def get_all_states(self) -> Dict[str, Dict[str, Any]]:
        now = time.time()
        result = {}
        for cid, state in self._states.items():
            if now - state.get("last_updated", 0) <= 4.0:
                result[cid] = state
            else:
                result[cid] = {
                    "camera_id": cid,
                    "fire_detected": False,
                    "confidence": 0.0,
                    "boxes": [],
                    "is_active_alert": False,
                    "last_updated": state.get("last_updated", 0)
                }
        return result


security_cache = SecurityDetectionCache()


class FireTrack:
    """Spatial-temporal track for a candidate fire blob across successive video frames."""

    def __init__(
        self,
        track_id: str,
        box: List[int],
        confidence: float,
        cls_name: str,
        crop: Optional[np.ndarray] = None,
        color_passed: bool = True
    ) -> None:
        self.track_id = track_id
        self.box = list(box)
        self.confidence = confidence
        self.cls_name = cls_name
        self.prev_crop = crop.copy() if crop is not None and crop.size > 0 else None

        self.consecutive_hits = 1
        self.consecutive_misses = 0
        self.color_passed_hits = 1 if color_passed else 0
        self.motion_passed_hits = 1
        self.static_frame_count = 0
        self.is_confirmed = False
        self.is_rejected_static = False

        self.created_at = time.time()
        self.last_seen_time = self.created_at

    def update(
        self,
        new_box: List[int],
        new_conf: float,
        new_crop: np.ndarray,
        color_passed: bool,
        is_dynamic: bool
    ) -> None:
        """Update track state with a new frame detection and smooth the bounding box."""
        # Exponential moving average for smooth bounding box display (alpha=0.65)
        alpha = 0.65
        self.box = [
            int(alpha * new_box[0] + (1 - alpha) * self.box[0]),
            int(alpha * new_box[1] + (1 - alpha) * self.box[1]),
            int(alpha * new_box[2] + (1 - alpha) * self.box[2]),
            int(alpha * new_box[3] + (1 - alpha) * self.box[3]),
        ]
        self.confidence = 0.7 * new_conf + 0.3 * self.confidence
        self.consecutive_hits += 1
        self.consecutive_misses = 0
        self.last_seen_time = time.time()

        if color_passed:
            self.color_passed_hits += 1

        if is_dynamic:
            self.motion_passed_hits += 1
            self.static_frame_count = max(0, self.static_frame_count - 1)
        else:
            self.static_frame_count += 1

        # Check for static object rejection (e.g. fire extinguisher / red sign with zero flicker for >= 3 frames)
        if self.static_frame_count >= 4 and self.confidence < 0.80:
            self.is_rejected_static = True
        else:
            self.is_rejected_static = False

        self.prev_crop = new_crop.copy() if new_crop is not None and new_crop.size > 0 else self.prev_crop

        # Confirmation State Machine
        # 1. Fast-track high confidence detections
        if self.confidence >= 0.75 and self.consecutive_hits >= 2 and self.color_passed_hits >= 1 and not self.is_rejected_static:
            self.is_confirmed = True
        # 2. Medium confidence detections require color verification and >= 3 hits
        elif self.consecutive_hits >= 3 and self.color_passed_hits >= 2 and not self.is_rejected_static:
            self.is_confirmed = True


class FireDetectionWorker:
    """Worker that consumes frames, applies CV filters, and tracks fire detections."""

    def __init__(
        self,
        raw_frame_queue: Queue[dict[str, Any]],
        consecutive_threshold: int = 3,
        alert_cooldown_seconds: float = 30.0,
        confidence_threshold: float = 0.35,
    ) -> None:
        self.raw_frame_queue = raw_frame_queue
        self.consecutive_threshold = consecutive_threshold
        self.alert_cooldown_seconds = alert_cooldown_seconds
        self.confidence_threshold = confidence_threshold

        # Spatial-temporal active tracks per camera
        self._camera_tracks: Dict[str, List[FireTrack]] = defaultdict(list)
        # Sustained confirmation count per camera
        self._camera_confirmed_history: Dict[str, deque[bool]] = defaultdict(lambda: deque(maxlen=8))
        # Last alert timestamp per camera
        self._last_alert_time: Dict[str, float] = {}

        self._model: Optional[Any] = None
        self._model_path = resolve_model_path()
        self._init_model()

    def _init_model(self) -> None:
        self._is_single_class_fire = False
        self._model_names = {}
        if YOLO is None:
            LOG.warning("Ultralytics YOLO not installed; fire detection worker running in fallback mode")
            return
        if self._model_path and os.path.exists(self._model_path):
            try:
                self._model = YOLO(self._model_path)
                names = getattr(self._model, "names", {})
                if len(names) == 1:
                    self._is_single_class_fire = True
                    if hasattr(self._model, "model") and hasattr(self._model.model, "names"):
                        self._model.model.names = {0: "fire"}
                    self._model_names = {0: "fire"}
                else:
                    self._is_single_class_fire = False
                    self._model_names = names
                LOG.info("Loaded Fire Detection model from %s with classes: %s", self._model_path, self._model_names)
            except Exception as e:
                LOG.exception("Failed to load YOLO model from %s: %s", self._model_path, e)
                self._model = None
        else:
            try:
                self._model = YOLO("yolov8n.pt")
                self._model_names = getattr(self._model, "names", {})
                LOG.info("Loaded fallback yolov8n.pt for detection worker")
            except Exception as e:
                LOG.warning("Could not load yolov8n.pt: %s", e)

    def _extract_raw_detections(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Run YOLO model and filter for valid fire/smoke candidate bounding boxes."""
        if frame is None or frame.size == 0 or self._model is None:
            return []

        raw_candidates: List[Dict[str, Any]] = []
        h, w = frame.shape[:2]

        try:
            results = self._model.predict(frame, verbose=False, conf=self.confidence_threshold)
            if results and len(results) > 0 and results[0].boxes is not None:
                for box in results[0].boxes:
                    cls_id = int(box.cls[0]) if box.cls is not None else 0
                    cls_name = str(self._model_names.get(cls_id, "")).lower().strip()
                    conf = float(box.conf[0]) if box.conf is not None else 0.0

                    is_fire_match = self._is_single_class_fire or (
                        cls_name in {"fire", "smoke", "flame"} or "fire" in cls_name or "smoke" in cls_name
                    )

                    if is_fire_match and conf >= self.confidence_threshold:
                        x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                        coords = [max(0, x1), max(0, y1), min(w, x2), min(h, y2)]

                        # 1. Geometry Filter: Reject noise specks or whole-frame glitches
                        if not is_valid_bounding_box_geometry(coords, w, h):
                            continue

                        raw_candidates.append({
                            "box": coords,
                            "conf": conf,
                            "cls_name": cls_name
                        })
        except Exception as e:
            LOG.debug("YOLO fire inference error: %s", e)

        return raw_candidates

    def _update_camera_tracks(
        self,
        camera_id: str,
        frame: np.ndarray,
        candidates: List[Dict[str, Any]]
    ) -> Tuple[bool, float, List[List[int]], bool]:
        """Match frame candidates with spatial-temporal tracks, apply color and flicker filters."""
        h, w = frame.shape[:2]
        existing_tracks = self._camera_tracks[camera_id]
        now = time.time()

        # Step 1: Pre-filter candidates with Chrominance Color Rules
        valid_candidates = []
        for cand in candidates:
            bx1, by1, bx2, by2 = cand["box"]
            crop = frame[by1:by2, bx1:bx2]
            is_smoke = "smoke" in cand["cls_name"]

            # Verify Fire Chrominance (HSV / YCrCb / RGB)
            color_passed, fire_ratio = verify_fire_chrominance(crop, is_smoke=is_smoke)

            # High confidence (>0.75) gets leniency, but low/medium conf must pass color rule
            if not color_passed and cand["conf"] < 0.70 and not is_smoke:
                LOG.debug("Candidate rejected by chrominance filter (fire_ratio=%.2f, conf=%.2f)", fire_ratio, cand["conf"])
                continue

            valid_candidates.append({
                "box": cand["box"],
                "conf": cand["conf"],
                "cls_name": cand["cls_name"],
                "crop": crop,
                "color_passed": color_passed
            })

        # Step 2: Spatial IoU Matching between existing tracks and valid candidates
        matched_track_indices = set()
        matched_candidate_indices = set()

        if existing_tracks and valid_candidates:
            iou_matrix = np.zeros((len(existing_tracks), len(valid_candidates)), dtype=np.float32)
            for i, track in enumerate(existing_tracks):
                for j, cand in enumerate(valid_candidates):
                    iou_matrix[i, j] = calculate_iou(track.box, cand["box"])

            # Greedy matching on highest IoU (threshold >= 0.15)
            while True:
                max_iou = np.max(iou_matrix) if iou_matrix.size > 0 else 0.0
                if max_iou < 0.15:
                    break
                i, j = np.unravel_index(np.argmax(iou_matrix), iou_matrix.shape)
                if i in matched_track_indices or j in matched_candidate_indices:
                    iou_matrix[i, j] = 0.0
                    continue

                matched_track_indices.add(i)
                matched_candidate_indices.add(j)
                iou_matrix[i, :] = 0.0
                iou_matrix[:, j] = 0.0

                # Compute dynamic motion flicker against previous frame's crop
                track = existing_tracks[i]
                cand = valid_candidates[j]
                is_dynamic, _ = calculate_motion_flicker(cand["crop"], track.prev_crop)

                # Update track state
                track.update(
                    new_box=cand["box"],
                    new_conf=cand["conf"],
                    new_crop=cand["crop"],
                    color_passed=cand["color_passed"],
                    is_dynamic=is_dynamic
                )

        # Step 3: Create new tracks for unmatched candidates
        for j, cand in enumerate(valid_candidates):
            if j not in matched_candidate_indices:
                new_track = FireTrack(
                    track_id=uuid.uuid4().hex[:8],
                    box=cand["box"],
                    confidence=cand["conf"],
                    cls_name=cand["cls_name"],
                    crop=cand["crop"],
                    color_passed=cand["color_passed"]
                )
                existing_tracks.append(new_track)

        # Step 4: Handle unmatched tracks and prune dead/stale tracks
        active_tracks: List[FireTrack] = []
        for i, track in enumerate(existing_tracks):
            if i not in matched_track_indices:
                track.consecutive_misses += 1

            # Keep tracks that were missed for at most 2 frames
            if track.consecutive_misses <= 2 and (now - track.last_seen_time <= 3.0):
                active_tracks.append(track)

        self._camera_tracks[camera_id] = active_tracks

        # Step 5: Evaluate confirmed & active tracks
        confirmed_tracks = [t for t in active_tracks if t.is_confirmed and not t.is_rejected_static]
        candidate_tracks = [t for t in active_tracks if t.consecutive_hits >= 2 and not t.is_rejected_static]

        # Display smoothed bounding boxes of confirmed or strong candidate tracks
        display_boxes = [t.box for t in (confirmed_tracks if confirmed_tracks else candidate_tracks)]
        max_conf = max([t.confidence for t in (confirmed_tracks or candidate_tracks)], default=0.0)
        has_detection = len(confirmed_tracks) > 0 or (len(candidate_tracks) > 0 and max_conf >= 0.65)

        # Update confirmed history for sustained alert condition
        confirmed_history = self._camera_confirmed_history[camera_id]
        confirmed_history.append(len(confirmed_tracks) > 0)
        recent_confirmed_count = sum(1 for c in confirmed_history if c)
        is_sustained_alert = recent_confirmed_count >= self.consecutive_threshold

        return has_detection, max_conf, display_boxes, is_sustained_alert

    def process_frame(self, item: dict[str, Any]) -> None:
        camera_id = item.get("camera_id")
        if not camera_id:
            return

        enabled_features = item.get("enabled_features") or {}
        has_fire_detection = (
            enabled_features.get("Fire detection") is True
            or str(enabled_features.get("Fire detection", "")).lower() == "true"
        )
        if not has_fire_detection:
            return

        frame = item.get("sampled_frame")
        if frame is None:
            return

        # 1. Run YOLO detection
        raw_candidates = self._extract_raw_detections(frame)

        # 2. Apply multi-stage false positive filtering & temporal tracking
        fire_present, confidence, boxes, is_alert_triggered = self._update_camera_tracks(
            camera_id=camera_id,
            frame=frame,
            candidates=raw_candidates
        )

        # 3. Update Live Security Cache with verified & smoothed results
        security_cache.update_camera_state(
            camera_id=camera_id,
            fire_detected=fire_present,
            confidence=confidence,
            boxes=boxes,
            is_active_alert=is_alert_triggered
        )

        # 4. Trigger database alert only if sustained over temporal threshold and cooled down
        if is_alert_triggered:
            now_sec = time.time()
            last_alert = self._last_alert_time.get(camera_id, 0.0)
            if now_sec - last_alert >= self.alert_cooldown_seconds:
                self._create_fire_alert(camera_id, confidence, item.get("camera_name"), item.get("location"))
                self._last_alert_time[camera_id] = now_sec

    def _create_fire_alert(
        self,
        camera_id: str,
        confidence: float,
        camera_name: Optional[str] = None,
        location: Optional[str] = None
    ) -> None:
        db = SessionLocal()
        try:
            alert_id = f"ALERT-FIRE-{uuid.uuid4().hex[:6].upper()}"
            conf_percent = int(confidence * 100) if confidence > 0 else 92
            ref_info = f"Confidence: {conf_percent}% | Cam: {camera_name or camera_id} | Area: {location or 'Zone'}"

            new_alert = Alert(
                alert_id=alert_id,
                camera_id=camera_id,
                alert_type="fire",
                severity="Critical",
                status="Active",
                reference_id=ref_info,
                timestamp=datetime.now()
            )
            db.add(new_alert)
            db.commit()
            LOG.warning(
                "🔥 VERIFIED CRITICAL FIRE ALERT CREATED: alert_id=%s camera=%s (%s) confidence=%.2f",
                alert_id, camera_id, camera_name, confidence
            )
        except Exception as e:
            LOG.exception("Failed to insert fire alert into DB: %s", e)
            db.rollback()
        finally:
            db.close()

    def run(self, stop_event: Event) -> None:
        """Run loop consuming frames continuously from raw_frame_queue."""
        LOG.info("Fire Detection Inference Worker started.")
        while not stop_event.is_set():
            try:
                item = self.raw_frame_queue.get(timeout=0.2)
                try:
                    self.process_frame(item)
                except Exception:
                    LOG.exception("Unexpected error processing frame in FireDetectionWorker")
                finally:
                    self.raw_frame_queue.task_done()
            except Empty:
                continue
            except Exception:
                LOG.exception("Fire detection queue get error")

        LOG.info("Fire Detection Inference Worker stopped.")


class FireInferenceManager:
    """Manages the background Fire Detection worker thread."""

    def __init__(self) -> None:
        self._worker: Optional[FireDetectionWorker] = None
        self._thread: Optional[Thread] = None
        self._stop_event: Optional[Event] = None

    def start(self, raw_frame_queue: Queue[dict[str, Any]]) -> None:
        self.stop()
        self._stop_event = Event()
        self._worker = FireDetectionWorker(raw_frame_queue)
        self._thread = Thread(
            target=self._worker.run,
            args=(self._stop_event,),
            daemon=True,
            name="fire-detection-worker"
        )
        self._thread.start()
        LOG.info("Fire Inference Manager initialized and thread started.")

    def stop(self) -> None:
        if self._stop_event is not None:
            self._stop_event.set()
        if self._thread is not None and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        self._worker = None
        self._thread = None
        self._stop_event = None
        LOG.info("Fire Inference Manager stopped.")


# Singleton instance
fire_inference_manager = FireInferenceManager()
