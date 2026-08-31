"""License Plate Detection & ANPR AI Inference Service.

Features an Active Vehicle Session Tracker & Multi-Frame Quality Optimizer specifically tuned
for CCTV parking entrances and security gates. Tracks approaching vehicles across consecutive frames,
selects the sharpest and highest-confidence OCR reading, prevents duplicate entries for the same vehicle,
filters out distant/blurry noise, saves clear plate snapshots, verifies against the blacklist registry,
and maintains real-time HUD overlays for video streams.
"""

from __future__ import annotations

import logging
import os
import re
import time
import uuid
from collections import defaultdict
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

try:
    import easyocr
except ImportError:
    easyocr = None

try:
    import pytesseract
except ImportError:
    pytesseract = None

from app.db.connection import SessionLocal
from app.models.alert import Alert
from app.models.blacklisted_vehicle import BlacklistedVehicle
from app.models.camera import Camera
from app.models.vehicle_log import VehicleLog
from app.services.license_plate_detection.filters import (
    calculate_centroid_distance,
    calculate_image_sharpness,
    calculate_iou,
    clean_plate_text,
    crop_plate_with_padding,
    is_valid_license_plate_text,
    is_valid_plate_geometry,
    preprocess_plate_image,
)

LOG = logging.getLogger(__name__)


def resolve_model_path() -> Optional[str]:
    """Find the trained license plate detection model weights file."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    root_dir = os.path.abspath(os.path.join(base_dir, ".."))
    candidates = [
        os.path.join(root_dir, "backend", "ml_models", "license_plate_detector.pt"),
        os.path.join(root_dir, "ml_models", "license_plate_detector.pt"),
        os.path.join(base_dir, "ml_models", "license_plate_detector.pt"),
        os.path.join(base_dir, "models", "license_plate_detector.pt"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return None


def get_snapshots_dir() -> str:
    """Ensure and return the absolute path to the plate snapshots directory."""
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    snapshots_dir = os.path.join(base_dir, "data", "snapshots", "plates")
    os.makedirs(snapshots_dir, exist_ok=True)
    return snapshots_dir


class LicensePlateDetectionCache:
    """Thread-safe cache holding latest verified license plate detection state per camera."""

    def __init__(self) -> None:
        self._states: Dict[str, Dict[str, Any]] = {}

    def update_camera_state(
        self,
        camera_id: str,
        plate_detected: bool,
        plate_number: str = "",
        confidence: float = 0.0,
        is_blacklisted: bool = False,
        boxes: Optional[List[List[int]]] = None,
        snapshot_url: Optional[str] = None,
    ) -> None:
        self._states[camera_id] = {
            "camera_id": camera_id,
            "plate_detected": plate_detected,
            "plate_number": plate_number,
            "confidence": confidence,
            "is_blacklisted": is_blacklisted,
            "boxes": boxes or [],
            "snapshot_url": snapshot_url,
            "last_updated": time.time()
        }

    def get_camera_state(self, camera_id: str) -> Dict[str, Any]:
        state = self._states.get(camera_id)
        if state and (time.time() - state.get("last_updated", 0) > 4.0):
            return {
                "camera_id": camera_id,
                "plate_detected": False,
                "plate_number": "",
                "confidence": 0.0,
                "is_blacklisted": False,
                "boxes": [],
                "snapshot_url": None,
                "last_updated": state["last_updated"]
            }
        return state or {
            "camera_id": camera_id,
            "plate_detected": False,
            "plate_number": "",
            "confidence": 0.0,
            "is_blacklisted": False,
            "boxes": [],
            "snapshot_url": None,
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
                    "plate_detected": False,
                    "plate_number": "",
                    "confidence": 0.0,
                    "is_blacklisted": False,
                    "boxes": [],
                    "snapshot_url": None,
                    "last_updated": state.get("last_updated", 0)
                }
        return result


license_plate_cache = LicensePlateDetectionCache()


class ActiveVehicleSession:
    """Represents a single vehicle passage event tracked across consecutive frames."""

    def __init__(self, track_id: str, camera_id: str, box: List[int]) -> None:
        self.track_id = track_id
        self.camera_id = camera_id
        self.box = box
        self.first_seen = time.time()
        self.last_seen = time.time()
        self.frames_tracked = 1

        self.best_text: str = ""
        self.best_conf: float = 0.0
        self.best_quality: float = 0.0
        self.best_crop: Optional[np.ndarray] = None

        self.db_log_id: Optional[str] = None
        self.snapshot_url: Optional[str] = None
        self.is_blacklisted: bool = False


class LicensePlateDetectionWorker:
    """Worker running YOLO license plate detection + OCR + active session tracking."""

    def __init__(
        self,
        frame_queue: Queue[dict[str, Any]],
        conf_threshold: float = 0.22,
        session_timeout_seconds: float = 3.5,
        plate_cooldown_seconds: float = 12.0
    ) -> None:
        self.frame_queue = frame_queue
        self.conf_threshold = conf_threshold
        self.session_timeout_seconds = session_timeout_seconds
        self.plate_cooldown_seconds = plate_cooldown_seconds

        self.model = None
        self.reader = None
        self.snapshots_dir = get_snapshots_dir()

        # In-memory camera configuration cache: camera_id -> (is_enabled, timestamp)
        self._camera_config_cache: Dict[str, Tuple[bool, float]] = {}

        # Active vehicle sessions per camera: camera_id -> list of ActiveVehicleSession
        self._active_sessions: Dict[str, List[ActiveVehicleSession]] = defaultdict(list)

        # Global plate cooldown per camera: camera_id -> {clean_plate_str: last_logged_timestamp}
        self._cooldown_plates: Dict[str, Dict[str, float]] = defaultdict(dict)

    def _init_models(self) -> None:
        model_path = resolve_model_path()
        if model_path and YOLO is not None:
            try:
                self.model = YOLO(model_path)
                LOG.info("Loaded License Plate Detection model weights from: %s", model_path)
            except Exception as e:
                LOG.error("Failed to load License Plate model: %s", e)
        else:
            LOG.warning("License Plate model weights not found or ultralytics not installed.")

        # Initialize EasyOCR reader
        if easyocr is not None:
            try:
                self.reader = easyocr.Reader(['en'], gpu=False)
                LOG.info("Initialized EasyOCR engine for license plate reading.")
            except Exception as e:
                LOG.error("Failed to initialize EasyOCR: %s", e)

    def _is_camera_configured_for_lpd(self, camera_id: str) -> bool:
        """Check if camera has License Plate Detection enabled (cached for 10s)."""
        now = time.time()
        if camera_id in self._camera_config_cache:
            is_enabled, last_checked = self._camera_config_cache[camera_id]
            if now - last_checked < 10.0:
                return is_enabled

        db = SessionLocal()
        try:
            cam = db.query(Camera).filter(Camera.camera_id == camera_id).first()
            if not cam:
                self._camera_config_cache[camera_id] = (False, now)
                return False

            has_lpd = False
            for m in cam.modules:
                if "license" in m.module_name.lower() or "vehicle" in m.module_name.lower():
                    has_lpd = True
                    break
            if not has_lpd:
                for f in cam.features:
                    if "license" in f.feature_name.lower() and f.is_enabled:
                        has_lpd = True
                        break

            self._camera_config_cache[camera_id] = (has_lpd, now)
            return has_lpd
        except Exception as e:
            LOG.error("Error checking camera config for LPD: %s", e)
            return False
        finally:
            db.close()

    def _perform_ocr(self, plate_crop: np.ndarray) -> Tuple[str, float]:
        """Run multi-pass OCR on preprocessed plate crop."""
        if plate_crop is None or plate_crop.size == 0:
            return "", 0.0

        enhanced_color, processed_gray = preprocess_plate_image(plate_crop)

        # 1. Try EasyOCR on processed grayscale (CLAHE + Bilateral)
        if self.reader is not None:
            try:
                # Pass 1: Enhanced Grayscale
                results = self.reader.readtext(processed_gray)
                if not results:
                    # Pass 2: Enhanced Color
                    results = self.reader.readtext(enhanced_color)
                if not results:
                    # Pass 3: Adaptive Threshold
                    thresh = cv2.adaptiveThreshold(processed_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
                    results = self.reader.readtext(thresh)

                full_texts = []
                conf_sum = 0.0
                count = 0

                for bbox, text, conf in results:
                    cleaned = clean_plate_text(text)
                    if cleaned:
                        full_texts.append(cleaned)
                        conf_sum += float(conf)
                        count += 1

                if full_texts:
                    combined_text = "".join(full_texts)
                    avg_conf = conf_sum / max(1, count)
                    cleaned_combined = clean_plate_text(combined_text)
                    if cleaned_combined and len(cleaned_combined) >= 4:
                        return cleaned_combined, avg_conf
            except Exception as e:
                LOG.warning("EasyOCR inference error: %s", e)

        # 2. Try PyTesseract fallback
        if pytesseract is not None:
            try:
                cfg = "--psm 7 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-"
                text = pytesseract.image_to_string(processed_gray, config=cfg)
                cleaned = clean_plate_text(text)
                if cleaned and len(cleaned) >= 4:
                    return cleaned, 0.70
            except Exception as e:
                LOG.debug("PyTesseract fallback error: %s", e)

        return "", 0.0

    def _save_snapshot(self, log_id: str, plate_crop: np.ndarray) -> str:
        """Save or overwrite cropped license plate image on disk."""
        filename = f"{log_id}.jpg"
        filepath = os.path.join(self.snapshots_dir, filename)
        try:
            cv2.imwrite(filepath, plate_crop)
            return f"/data/snapshots/plates/{filename}"
        except Exception as e:
            LOG.error("Failed to save license plate snapshot (%s): %s", filepath, e)
            return ""

    def _insert_vehicle_log(
        self,
        camera_id: str,
        plate_number: str,
        confidence: float,
        plate_crop: np.ndarray
    ) -> Dict[str, Any]:
        """Check blacklist, save snapshot, insert VehicleLog, and raise Alert if blacklisted."""
        log_id = str(uuid.uuid4())
        snapshot_url = self._save_snapshot(log_id, plate_crop)

        db = SessionLocal()
        is_blacklisted = False
        try:
            # Check blacklist registry with alphanumeric normalization
            clean_detected = re.sub(r'[^A-Z0-9]', '', (plate_number or '').upper())
            active_blacklists = db.query(BlacklistedVehicle).filter(
                BlacklistedVehicle.is_active == True
            ).all()

            blacklisted = None
            if clean_detected:
                for bv in active_blacklists:
                    clean_bv = re.sub(r'[^A-Z0-9]', '', (bv.plate_number or '').upper())
                    if clean_bv and (clean_detected == clean_bv or clean_detected in clean_bv or clean_bv in clean_detected):
                        blacklisted = bv
                        break

            if blacklisted:
                is_blacklisted = True
                alert = Alert(
                    alert_id=str(uuid.uuid4()),
                    camera_id=camera_id,
                    alert_type="blacklist",
                    severity="high",
                    status="active",
                    reference_id=log_id,
                    timestamp=datetime.now()
                )
                db.add(alert)
                LOG.warning("BLACKLISTED VEHICLE DETECTED: %s (matched %s) at camera=%s", plate_number, blacklisted.plate_number, camera_id)

            vehicle_log = VehicleLog(
                log_id=log_id,
                camera_id=camera_id,
                plate_number=plate_number,
                entry_time=datetime.now(),
                confidence_score=confidence,
                is_blacklisted=is_blacklisted,
                snapshot_url=snapshot_url
            )
            db.add(vehicle_log)
            db.commit()
            LOG.info("Logged verified vehicle entry: plate=%s, conf=%.2f, blacklisted=%s", plate_number, confidence, is_blacklisted)
        except Exception as e:
            db.rollback()
            LOG.error("Failed to insert vehicle log in DB: %s", e)
        finally:
            db.close()

        return {
            "log_id": log_id,
            "plate_number": plate_number,
            "confidence": confidence,
            "is_blacklisted": is_blacklisted,
            "snapshot_url": snapshot_url
        }

    def _update_vehicle_log(
        self,
        log_id: str,
        plate_number: str,
        confidence: float,
        plate_crop: np.ndarray
    ) -> None:
        """Update existing VehicleLog with a clearer reading from a closer/sharper frame."""
        self._save_snapshot(log_id, plate_crop)
        db = SessionLocal()
        try:
            log = db.query(VehicleLog).filter(VehicleLog.log_id == log_id).first()
            if log:
                log.plate_number = plate_number
                log.confidence_score = confidence

                # If updated to a valid high-confidence plate, check blacklist registry
                if not log.is_blacklisted and plate_number and plate_number != "-":
                    clean_detected = re.sub(r'[^A-Z0-9]', '', plate_number.upper())
                    if clean_detected:
                        active_blacklists = db.query(BlacklistedVehicle).filter(
                            BlacklistedVehicle.is_active == True
                        ).all()
                        for bv in active_blacklists:
                            clean_bv = re.sub(r'[^A-Z0-9]', '', (bv.plate_number or '').upper())
                            if clean_bv and (clean_detected == clean_bv or clean_detected in clean_bv or clean_bv in clean_detected):
                                log.is_blacklisted = True
                                alert = Alert(
                                    alert_id=str(uuid.uuid4()),
                                    camera_id=log.camera_id,
                                    alert_type="blacklist",
                                    severity="high",
                                    status="active",
                                    reference_id=log_id,
                                    timestamp=datetime.now()
                                )
                                db.add(alert)
                                LOG.warning("BLACKLISTED VEHICLE DETECTED UPON RESOLUTION: %s at camera=%s", plate_number, log.camera_id)
                                break

                db.commit()
                LOG.debug("Updated vehicle log %s with higher quality reading: %s (conf: %.2f)", log_id, plate_number, confidence)
        except Exception as e:
            db.rollback()
            LOG.error("Failed to update vehicle log in DB: %s", e)
        finally:
            db.close()

    def _match_or_create_session(
        self,
        camera_id: str,
        box: List[int]
    ) -> ActiveVehicleSession:
        """Associate detected bounding box with an active vehicle session track."""
        now = time.time()
        active_list = self._active_sessions[camera_id]
        bw = box[2] - box[0]
        bh = box[3] - box[1]

        best_session = None
        best_match_score = 0.0

        for session in active_list:
            iou = calculate_iou(box, session.box)
            dist = calculate_centroid_distance(box, session.box)
            max_dim = max(bw, bh)

            if iou > 0.18:
                if iou > best_match_score:
                    best_match_score = iou
                    best_session = session
            elif dist < max_dim * 1.5:
                # Proximity match as vehicle moves forward
                score = 1.0 / max(1.0, dist)
                if score > best_match_score:
                    best_match_score = score
                    best_session = session

        if best_session is not None:
            best_session.box = box
            best_session.last_seen = now
            best_session.frames_tracked += 1
            return best_session

        # Create new session track
        new_track = ActiveVehicleSession(
            track_id=str(uuid.uuid4()),
            camera_id=camera_id,
            box=box
        )
        self._active_sessions[camera_id].append(new_track)
        return new_track

    def _cleanup_stale_sessions(self, camera_id: str) -> None:
        """Evict sessions of vehicles that have driven out of the camera view."""
        now = time.time()
        active_list = self._active_sessions[camera_id]

        surviving = []
        for session in active_list:
            if (now - session.last_seen) < self.session_timeout_seconds:
                surviving.append(session)
            else:
                # Session has ended - register in cooldown so same vehicle does not re-log immediately
                if session.best_text:
                    clean_plate = re.sub(r'[^A-Z0-9]', '', session.best_text.upper())
                    if clean_plate:
                        self._cooldown_plates[camera_id][clean_plate] = now

        self._active_sessions[camera_id] = surviving

        # Clean old cooldown entries (> 30s)
        self._cooldown_plates[camera_id] = {
            p: ts for p, ts in self._cooldown_plates[camera_id].items()
            if (now - ts) < self.plate_cooldown_seconds
        }

    def process_frame(self, item: dict[str, Any]) -> None:
        """Process a single frame from the queue."""
        camera_id = item.get("camera_id")
        frame = item.get("sampled_frame") if item.get("sampled_frame") is not None else item.get("frame")
        enabled_features = item.get("enabled_features") or item.get("features") or {}

        if not camera_id or frame is None:
            return

        # Check if this camera has License Plate Detection enabled
        is_lpd_enabled = any(
            ("license" in str(k).lower() or "plate" in str(k).lower() or "anpr" in str(k).lower() or "vehicle" in str(k).lower()) and bool(v)
            for k, v in enabled_features.items()
        )

        if not is_lpd_enabled:
            is_lpd_enabled = self._is_camera_configured_for_lpd(camera_id)

        if not is_lpd_enabled:
            return

        if self.model is None:
            return

        h, w = frame.shape[:2]
        try:
            results = self.model.predict(
                source=frame,
                conf=self.conf_threshold,
                verbose=False,
                device="cpu"
            )
        except Exception as e:
            LOG.error("License plate model inference failed on camera %s: %s", camera_id, e)
            return

        # Clean up departed vehicle sessions
        self._cleanup_stale_sessions(camera_id)

        detected_boxes: List[List[int]] = []
        latest_plate_num = ""
        latest_conf = 0.0
        latest_blacklisted = False
        latest_snapshot = None

        if results and len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes.xyxy.cpu().numpy()
            confs = results[0].boxes.conf.cpu().numpy()

            for i, box in enumerate(boxes):
                x1, y1, x2, y2 = [int(v) for v in box]
                conf = float(confs[i])
                bw = x2 - x1
                bh = y2 - y1

                if not is_valid_plate_geometry([x1, y1, x2, y2], w, h):
                    continue

                detected_boxes.append([x1, y1, x2, y2])

                # Associate detection with a continuous vehicle session
                session = self._match_or_create_session(camera_id, [x1, y1, x2, y2])

                # Crop plate region with safety padding
                plate_crop = crop_plate_with_padding(frame, [x1, y1, x2, y2])
                if plate_crop.size == 0:
                    continue

                # Filter out distant / tiny crops (e.g. car in far background) to prevent garbage OCR
                # For parking CCTV, wait until the plate is sufficiently large and clear
                if bw < 55 or bh < 18:
                    # Show visual box on stream HUD, but do not trigger OCR on distant noise
                    if session.best_text:
                        latest_plate_num = session.best_text
                        latest_conf = session.best_conf
                        latest_blacklisted = session.is_blacklisted
                    continue

                # Compute image sharpness
                sharpness = calculate_image_sharpness(plate_crop)

                # Run OCR extraction
                extracted_text, ocr_conf = self._perform_ocr(plate_crop)

                # Strict High-Confidence OCR Threshold (70%):
                # If confidence is below 70%, do not store/show speculative garbage characters.
                # Instead, save the clear snapshot and show "-" for plate text so operators inspect the image.
                MIN_OCR_CONFIDENCE = 0.70
                is_confident_read = (
                    bool(extracted_text)
                    and is_valid_license_plate_text(extracted_text)
                    and (ocr_conf >= MIN_OCR_CONFIDENCE)
                )

                if is_confident_read:
                    # Multi-factor quality score: combination of OCR confidence, crop resolution, and sharpness
                    crop_res_score = min(float(bw * bh), 8000.0) / 8000.0
                    sharp_score = min(sharpness, 400.0) / 400.0
                    quality = (ocr_conf * 0.5) + (crop_res_score * 0.3) + (sharp_score * 0.2)

                    # If this reading is clearer / higher quality than previous frames of this vehicle
                    if quality > session.best_quality:
                        session.best_text = extracted_text
                        session.best_conf = ocr_conf
                        session.best_quality = quality
                        session.best_crop = plate_crop

                        clean_plate = re.sub(r'[^A-Z0-9]', '', extracted_text.upper())
                        now = time.time()
                        last_logged_ts = self._cooldown_plates[camera_id].get(clean_plate, 0.0)

                        if session.db_log_id is None:
                            # If not in cooldown window, create a new vehicle entry
                            if (now - last_logged_ts) > self.plate_cooldown_seconds:
                                log_res = self._insert_vehicle_log(
                                    camera_id=camera_id,
                                    plate_number=extracted_text,
                                    confidence=ocr_conf,
                                    plate_crop=plate_crop
                                )
                                session.db_log_id = log_res["log_id"]
                                session.snapshot_url = log_res["snapshot_url"]
                                session.is_blacklisted = log_res["is_blacklisted"]
                                self._cooldown_plates[camera_id][clean_plate] = now
                        else:
                            # Update existing log with the high-confidence plate reading
                            self._update_vehicle_log(
                                log_id=session.db_log_id,
                                plate_number=extracted_text,
                                confidence=ocr_conf,
                                plate_crop=plate_crop
                            )
                else:
                    # Low OCR confidence: vehicle detected, save snapshot and log with '-' if not logged yet
                    if session.db_log_id is None and session.frames_tracked >= 2:
                        session.best_crop = plate_crop
                        session.best_conf = max(conf, ocr_conf)
                        log_res = self._insert_vehicle_log(
                            camera_id=camera_id,
                            plate_number="-",
                            confidence=round(conf, 2),
                            plate_crop=plate_crop
                        )
                        session.db_log_id = log_res["log_id"]
                        session.snapshot_url = log_res["snapshot_url"]
                        session.is_blacklisted = False

                # Update HUD variables from session
                if session.best_text and (session.best_conf >= MIN_OCR_CONFIDENCE):
                    latest_plate_num = session.best_text
                    latest_conf = session.best_conf
                    latest_blacklisted = session.is_blacklisted
                    latest_snapshot = session.snapshot_url
                else:
                    latest_plate_num = "-"
                    latest_conf = conf
                    latest_snapshot = session.snapshot_url

        # Update cache for streaming visual overlays
        has_plate = len(detected_boxes) > 0
        license_plate_cache.update_camera_state(
            camera_id=camera_id,
            plate_detected=has_plate,
            plate_number=latest_plate_num,
            confidence=latest_conf,
            is_blacklisted=latest_blacklisted,
            boxes=detected_boxes,
            snapshot_url=latest_snapshot
        )

    def run(self, stop_event: Event) -> None:
        """Main inference worker loop consuming frames."""
        self._init_models()
        LOG.info("License Plate Detection inference worker started.")

        while not stop_event.is_set():
            try:
                item = self.frame_queue.get(timeout=0.2)
                self.process_frame(item)
            except Empty:
                continue
            except Exception as e:
                LOG.error("Unexpected error in license plate inference loop: %s", e)

        LOG.info("License Plate Detection inference worker stopped.")


class LicensePlateInferenceManager:
    """Manages the lifecycle of the license plate detection worker thread."""

    def __init__(self) -> None:
        self._thread: Optional[Thread] = None
        self._stop_event: Optional[Event] = None
        self._worker: Optional[LicensePlateDetectionWorker] = None

    def start(self, frame_queue: Queue[dict[str, Any]]) -> None:
        """Start the background inference worker."""
        self.stop()
        self._stop_event = Event()
        self._worker = LicensePlateDetectionWorker(frame_queue)
        self._thread = Thread(
            target=self._worker.run,
            args=(self._stop_event,),
            daemon=True,
            name="inference-license-plate"
        )
        self._thread.start()
        LOG.info("License Plate Detection manager started inference worker thread.")

    def stop(self) -> None:
        """Stop the background inference worker."""
        if self._stop_event is not None:
            self._stop_event.set()
        if self._thread is not None and self._thread.is_alive():
            self._thread.join(timeout=1.5)
        self._thread = None
        self._stop_event = None
        self._worker = None

    def get_status(self) -> Dict[str, Any]:
        return {
            "status": "running" if self._thread and self._thread.is_alive() else "stopped",
            "active_cameras": list(license_plate_cache.get_all_states().keys())
        }


# Global singleton instance
license_plate_inference_manager = LicensePlateInferenceManager()
