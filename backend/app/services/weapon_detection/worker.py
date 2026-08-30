"""Weapon & Threat Detection AI Inference Service.

Consumes sampled frames from the central raw frame queue, runs Threat/Firearm
detection inference (YOLO), applies spatial-temporal IoU tracking and multi-frame
persistence confirmation to eliminate transient false alarms, logs verified alerts
to the database, and caches live detection metadata for video streaming overlays.
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
from app.services.weapon_detection.filters import (
    calculate_iou,
    is_valid_weapon_geometry,
    verify_weapon_contrast_and_texture,
)

LOG = logging.getLogger(__name__)


def resolve_model_path() -> Optional[str]:
    """Find the trained weapon/threat detection model weights file."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    root_dir = os.path.abspath(os.path.join(base_dir, ".."))
    candidates = [
        os.path.join(root_dir, "backend", "ml_models", "weapon_detection.pt"),
        os.path.join(root_dir, "backend", "ml_models", "threat_detection.pt"),
        os.path.join(root_dir, "backend", "models", "weapon_detection.pt"),
        os.path.join(root_dir, "backend", "ml_models", "yolov8n.pt"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


class WeaponDetectionCache:
    """Thread-safe cache holding latest verified weapon detection state per camera."""

    def __init__(self) -> None:
        self._states: Dict[str, Dict[str, Any]] = {}

    def update_camera_state(
        self,
        camera_id: str,
        weapon_detected: bool,
        confidence: float = 0.0,
        threat_class: str = "Gun",
        boxes: Optional[List[List[int]]] = None,
        is_active_alert: bool = False
    ) -> None:
        self._states[camera_id] = {
            "camera_id": camera_id,
            "weapon_detected": weapon_detected,
            "confidence": confidence,
            "threat_class": threat_class,
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
                "weapon_detected": False,
                "confidence": 0.0,
                "threat_class": "Gun",
                "boxes": [],
                "is_active_alert": False,
                "last_updated": state["last_updated"]
            }
        return state or {
            "camera_id": camera_id,
            "weapon_detected": False,
            "confidence": 0.0,
            "threat_class": "Gun",
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
                    "weapon_detected": False,
                    "confidence": 0.0,
                    "threat_class": "Gun",
                    "boxes": [],
                    "is_active_alert": False,
                    "last_updated": state.get("last_updated", 0)
                }
        return result


weapon_cache = WeaponDetectionCache()


class WeaponTrack:
    """Spatial-temporal track for a candidate weapon across successive video frames."""

    def __init__(
        self,
        track_id: str,
        box: List[int],
        confidence: float,
        cls_name: str,
        crop: Optional[np.ndarray] = None
    ) -> None:
        self.track_id = track_id
        self.box = list(box)
        self.confidence = confidence
        self.cls_name = cls_name
        self.prev_crop = crop.copy() if crop is not None and crop.size > 0 else None

        self.consecutive_hits = 1
        self.consecutive_misses = 0
        self.is_confirmed = False

        self.created_at = time.time()
        self.last_seen_time = self.created_at

    def update(
        self,
        new_box: List[int],
        new_conf: float,
        new_crop: np.ndarray,
        cls_name: str
    ) -> None:
        """Update track state with a new frame detection and smooth the bounding box."""
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
        self.cls_name = cls_name
        self.last_seen_time = time.time()
        self.prev_crop = new_crop.copy() if new_crop is not None and new_crop.size > 0 else self.prev_crop

        # Confirmation criteria
        if self.confidence >= 0.65 and self.consecutive_hits >= 2:
            self.is_confirmed = True
        elif self.consecutive_hits >= 3 and self.confidence >= 0.35:
            self.is_confirmed = True


class WeaponDetectionWorker:
    """Worker that consumes frames, applies spatial-temporal tracking, and detects weapons."""

    def __init__(
        self,
        frame_queue: Queue[dict[str, Any]],
        consecutive_threshold: int = 3,
        alert_cooldown_seconds: float = 30.0,
        confidence_threshold: float = 0.30,
    ) -> None:
        self.frame_queue = frame_queue
        self.consecutive_threshold = consecutive_threshold
        self.alert_cooldown_seconds = alert_cooldown_seconds
        self.confidence_threshold = confidence_threshold

        # Spatial-temporal active tracks per camera
        self._camera_tracks: Dict[str, List[WeaponTrack]] = defaultdict(list)
        # Sustained confirmation history per camera
        self._camera_confirmed_history: Dict[str, deque[bool]] = defaultdict(lambda: deque(maxlen=8))
        # Last alert timestamp per camera
        self._last_alert_time: Dict[str, float] = {}

        self._model: Optional[Any] = None
        self._model_path = resolve_model_path()
        self._model_names: Dict[int, str] = {}
        self._init_model()

    def _init_model(self) -> None:
        if YOLO is None:
            LOG.warning("Ultralytics YOLO not installed; weapon detection worker running in fallback mode")
            return
        if self._model_path and os.path.exists(self._model_path):
            try:
                self._model = YOLO(self._model_path)
                self._model_names = getattr(self._model, "names", {})
                LOG.info("Loaded Weapon Detection model from %s with classes: %s", self._model_path, self._model_names)
            except Exception as e:
                LOG.exception("Failed to load YOLO weapon model from %s: %s", self._model_path, e)
                self._model = None
        else:
            try:
                self._model = YOLO("yolov8n.pt")
                self._model_names = getattr(self._model, "names", {})
                LOG.info("Loaded fallback yolov8n.pt for weapon detection worker")
            except Exception as e:
                LOG.warning("Could not load yolov8n.pt: %s", e)

    def _is_weapon_class(self, cls_name: str) -> bool:
        """Check if class corresponds to a weapon or armed threat."""
        name = cls_name.lower().strip()
        weapon_keywords = {"gun", "pistol", "rifle", "firearm", "knife", "blade", "weapon", "grenade", "dagger", "sword"}
        return any(k in name for k in weapon_keywords) or (len(self._model_names) == 1 and name == "gun")

    def _extract_raw_detections(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Run YOLO model and filter for valid weapon candidate bounding boxes."""
        if frame is None or frame.size == 0 or self._model is None:
            return []

        raw_candidates: List[Dict[str, Any]] = []
        h, w = frame.shape[:2]

        try:
            results = self._model.predict(frame, verbose=False, conf=self.confidence_threshold)
            if results and len(results) > 0 and results[0].boxes is not None:
                for box in results[0].boxes:
                    cls_id = int(box.cls[0]) if box.cls is not None else 0
                    cls_name = str(self._model_names.get(cls_id, "Gun")).strip()
                    conf = float(box.conf[0]) if box.conf is not None else 0.0

                    if self._is_weapon_class(cls_name) and conf >= self.confidence_threshold:
                        x1, y1, x2, y2 = map(int, box.xyxy[0].cpu().numpy())
                        coords = [max(0, x1), max(0, y1), min(w, x2), min(h, y2)]

                        # 1. Geometry Filter: Reject noise specks or whole-frame glitches
                        if not is_valid_weapon_geometry(coords, w, h):
                            continue

                        # 2. Contrast & Texture Filter
                        crop = frame[coords[1]:coords[3], coords[0]:coords[2]]
                        texture_passed, _ = verify_weapon_contrast_and_texture(crop)
                        if not texture_passed and conf < 0.65:
                            continue

                        raw_candidates.append({
                            "box": coords,
                            "conf": conf,
                            "cls_name": cls_name,
                            "crop": crop
                        })
        except Exception as e:
            LOG.debug("YOLO weapon inference error: %s", e)

        return raw_candidates

    def _update_camera_tracks(
        self,
        camera_id: str,
        frame: np.ndarray,
        candidates: List[Dict[str, Any]]
    ) -> Tuple[bool, float, str, List[List[int]], bool]:
        """Match frame candidates with spatial-temporal tracks and evaluate persistence."""
        existing_tracks = self._camera_tracks[camera_id]
        now = time.time()

        matched_track_indices = set()
        matched_candidate_indices = set()

        if existing_tracks and candidates:
            iou_matrix = np.zeros((len(existing_tracks), len(candidates)), dtype=np.float32)
            for i, track in enumerate(existing_tracks):
                for j, cand in enumerate(candidates):
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

                # Update track
                track = existing_tracks[i]
                cand = candidates[j]
                track.update(
                    new_box=cand["box"],
                    new_conf=cand["conf"],
                    new_crop=cand["crop"],
                    cls_name=cand["cls_name"]
                )

        # Create new tracks for unmatched candidates
        for j, cand in enumerate(candidates):
            if j not in matched_candidate_indices:
                new_track = WeaponTrack(
                    track_id=uuid.uuid4().hex[:8],
                    box=cand["box"],
                    confidence=cand["conf"],
                    cls_name=cand["cls_name"],
                    crop=cand["crop"]
                )
                existing_tracks.append(new_track)

        # Handle unmatched tracks and prune dead tracks
        active_tracks: List[WeaponTrack] = []
        for i, track in enumerate(existing_tracks):
            if i not in matched_track_indices:
                track.consecutive_misses += 1

            if track.consecutive_misses <= 2 and (now - track.last_seen_time <= 3.0):
                active_tracks.append(track)

        self._camera_tracks[camera_id] = active_tracks

        # Evaluate confirmed & active tracks
        confirmed_tracks = [t for t in active_tracks if t.is_confirmed]
        candidate_tracks = [t for t in active_tracks if t.consecutive_hits >= 2]

        display_tracks = confirmed_tracks if confirmed_tracks else candidate_tracks
        display_boxes = [t.box for t in display_tracks]
        max_conf = max([t.confidence for t in display_tracks], default=0.0)
        dominant_class = display_tracks[0].cls_name if display_tracks else "Gun"
        has_detection = len(confirmed_tracks) > 0 or (len(candidate_tracks) > 0 and max_conf >= 0.60)

        # Update confirmed history for sustained alert condition
        confirmed_history = self._camera_confirmed_history[camera_id]
        confirmed_history.append(len(confirmed_tracks) > 0)
        recent_confirmed_count = sum(1 for c in confirmed_history if c)
        is_sustained_alert = recent_confirmed_count >= self.consecutive_threshold

        return has_detection, max_conf, dominant_class, display_boxes, is_sustained_alert

    def process_frame(self, item: dict[str, Any]) -> None:
        camera_id = item.get("camera_id")
        if not camera_id:
            return

        enabled_features = item.get("enabled_features") or {}
        has_weapon_detection = (
            enabled_features.get("Weapon detection") is True
            or enabled_features.get("Weapon Detection") is True
            or str(enabled_features.get("Weapon detection", "")).lower() == "true"
        )
        if not has_weapon_detection:
            return

        frame = item.get("sampled_frame")
        if frame is None:
            return

        # 1. Run YOLO detection
        raw_candidates = self._extract_raw_detections(frame)

        # 2. Apply spatial-temporal tracking
        weapon_present, confidence, threat_class, boxes, is_alert_triggered = self._update_camera_tracks(
            camera_id=camera_id,
            frame=frame,
            candidates=raw_candidates
        )

        # 3. Update Live Cache with smoothed results
        weapon_cache.update_camera_state(
            camera_id=camera_id,
            weapon_detected=weapon_present,
            confidence=confidence,
            threat_class=threat_class,
            boxes=boxes,
            is_active_alert=is_alert_triggered
        )

        # 4. Trigger database alert only if sustained over temporal threshold and cooled down
        if is_alert_triggered:
            now_sec = time.time()
            last_alert = self._last_alert_time.get(camera_id, 0.0)
            if now_sec - last_alert >= self.alert_cooldown_seconds:
                self._create_weapon_alert(camera_id, confidence, threat_class, item.get("camera_name"), item.get("location"))
                self._last_alert_time[camera_id] = now_sec

    def _create_weapon_alert(
        self,
        camera_id: str,
        confidence: float,
        threat_class: str,
        camera_name: Optional[str] = None,
        location: Optional[str] = None
    ) -> None:
        db = SessionLocal()
        try:
            alert_id = f"ALERT-WEAPON-{uuid.uuid4().hex[:6].upper()}"
            conf_percent = int(confidence * 100) if confidence > 0 else 90
            ref_info = f"Weapon: {threat_class.capitalize()} ({conf_percent}%) | Cam: {camera_name or camera_id} | Area: {location or 'Zone'}"

            new_alert = Alert(
                alert_id=alert_id,
                camera_id=camera_id,
                alert_type="weapon",
                severity="Critical",
                status="Active",
                reference_id=ref_info,
                timestamp=datetime.now()
            )
            db.add(new_alert)
            db.commit()
            LOG.warning(
                "🚨 VERIFIED WEAPON THREAT ALERT CREATED: alert_id=%s camera=%s (%s) type=%s conf=%.2f",
                alert_id, camera_id, camera_name, threat_class, confidence
            )
        except Exception as e:
            LOG.exception("Failed to insert weapon alert into DB: %s", e)
            db.rollback()
        finally:
            db.close()

    def run(self, stop_event: Event) -> None:
        """Run loop consuming frames continuously from frame_queue."""
        LOG.info("Weapon Detection Inference Worker started.")
        while not stop_event.is_set():
            try:
                item = self.frame_queue.get(timeout=0.2)
                try:
                    self.process_frame(item)
                except Exception:
                    LOG.exception("Unexpected error processing frame in WeaponDetectionWorker")
                finally:
                    self.frame_queue.task_done()
            except Empty:
                continue
            except Exception:
                LOG.exception("Weapon detection queue get error")

        LOG.info("Weapon Detection Inference Worker stopped.")


class WeaponInferenceManager:
    """Manages the background Weapon Detection worker thread."""

    def __init__(self) -> None:
        self._worker: Optional[WeaponDetectionWorker] = None
        self._thread: Optional[Thread] = None
        self._stop_event: Optional[Event] = None
        self._queue: Optional[Queue[dict[str, Any]]] = None

    def start(self, raw_frame_queue: Queue[dict[str, Any]]) -> None:
        self.stop()
        self._stop_event = Event()
        self._queue = raw_frame_queue
        self._worker = WeaponDetectionWorker(self._queue)
        self._thread = Thread(
            target=self._worker.run,
            args=(self._stop_event,),
            daemon=True,
            name="weapon-detection-worker"
        )
        self._thread.start()
        LOG.info("Weapon Inference Manager initialized and thread started.")

    def stop(self) -> None:
        if self._stop_event is not None:
            self._stop_event.set()
        if self._thread is not None and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        self._worker = None
        self._thread = None
        self._stop_event = None
        self._queue = None
        LOG.info("Weapon Inference Manager stopped.")


# Singleton instance
weapon_inference_manager = WeaponInferenceManager()
