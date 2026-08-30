"""Continuously acquire sampled frames and publish raw-frame queue messages.

The queue payload is a Python dictionary so it can carry the original OpenCV
``numpy.ndarray`` without a lossy encode/decode step.  For a JSON-only broker,
call :meth:`VideoIngestionWorker.payload_to_json` before publishing; it encodes
the frame as base64 JPEG in the ``sampled_frame`` field.
"""

from __future__ import annotations

import base64
import json
import logging
import queue as queue_module
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from threading import Event
from typing import Any, Callable, Mapping, Protocol

try:
    import cv2
except ImportError:  # pragma: no cover - gives a clearer runtime error
    cv2 = None  # type: ignore[assignment]


LOG = logging.getLogger(__name__)
SUPPORTED_SOURCE_TYPES = frozenset({"rtsp", "webcam", "file"})


class FrameQueue(Protocol):
    def put(self, item: dict[str, Any], timeout: float | None = None) -> None: ...


@dataclass(frozen=True)
class CameraConfig:
    """Configuration for one input source.

    ``source_identifier`` is an RTSP URL/file path for ``rtsp`` and ``file``,
    and a webcam index (for example ``0``) for ``webcam``.
    """

    camera_id: str
    camera_name: str
    source_type: str
    source_identifier: str | int
    processing_fps: float
    floor: str | None = None
    location: str | None = None
    enabled_features: dict[str, bool] = field(default_factory=dict)
    reconnect_delay_seconds: float = 5.0
    loop_file: bool = False
    source_fps_fallback: float = 30.0

    @classmethod
    def from_mapping(cls, value: Mapping[str, Any]) -> "CameraConfig":
        source_type = str(value["source_type"]).lower()
        if source_type not in SUPPORTED_SOURCE_TYPES:
            raise ValueError(f"Unsupported source_type '{source_type}'. Expected one of {sorted(SUPPORTED_SOURCE_TYPES)}")

        # Accept both names to ease migration from older camera configuration.
        source_identifier = value.get("source_identifier", value.get("source"))
        if source_identifier is None:
            raise ValueError("Camera configuration needs source_identifier (or source)")
        if source_type == "webcam" and isinstance(source_identifier, str) and source_identifier.isdigit():
            source_identifier = int(source_identifier)

        processing_fps = float(value["processing_fps"])
        if processing_fps <= 0:
            raise ValueError("processing_fps must be greater than zero")
        return cls(
            camera_id=str(value["camera_id"]),
            camera_name=str(value.get("camera_name", value["camera_id"])),
            source_type=source_type,
            source_identifier=source_identifier,
            processing_fps=processing_fps,
            floor=value.get("floor"),
            location=value.get("location"),
            enabled_features=dict(value.get("enabled_features", {})),
            reconnect_delay_seconds=float(value.get("reconnect_delay_seconds", 5)),
            loop_file=bool(value.get("loop_file", False)),
            source_fps_fallback=float(value.get("source_fps_fallback", 30)),
        )


def load_camera_configs(path: str | Path) -> list[CameraConfig]:
    """Read cameras from either a JSON array or ``{\"cameras\": [...]}``."""
    with Path(path).open(encoding="utf-8") as config_file:
        document = json.load(config_file)
    entries = document["cameras"] if isinstance(document, dict) else document
    if not isinstance(entries, list):
        raise ValueError("Camera JSON must be an array or an object with a cameras array")
    return [CameraConfig.from_mapping(item) for item in entries]


class FrameSampler:
    """Frame-count sampler that distributes samples evenly for non-integer ratios."""

    def __init__(self, source_fps: float, processing_fps: float) -> None:
        self.source_fps = max(source_fps, 0.001)
        self.processing_fps = processing_fps
        self._stride = max(self.source_fps / processing_fps, 1.0)
        self._next_sample_at = 1.0

    def take(self, frame_number: int) -> bool:
        if frame_number + 1e-9 < self._next_sample_at:
            return False
        self._next_sample_at += self._stride
        return True


def resolve_source(source: str | int) -> str | int:
    if source is None:
        return source
    if isinstance(source, int):
        return source
    clean = str(source).strip()
    if clean.isdigit():
        return int(clean)
    if clean.startswith(("rtsp://", "http://", "https://")):
        return clean
    clean_path = clean.replace("demo://", "").strip()
    if clean_path.startswith("/"):
        clean_path = clean_path[1:]
    import os
    filename = os.path.basename(clean_path)
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    possible_paths = [
        clean_path,
        os.path.join(os.getcwd(), clean_path),
        os.path.join(os.getcwd(), "data", clean_path),
        os.path.join(os.getcwd(), "data", "videos", filename),
        os.path.join(os.getcwd(), "backend", clean_path),
        os.path.join(os.getcwd(), "backend", "data", "videos", filename),
        os.path.join(base_dir, clean_path),
        os.path.join(base_dir, "data", "videos", filename),
        os.path.join(base_dir, "videos", filename),
    ]
    return next((os.path.abspath(p) for p in possible_paths if os.path.exists(os.path.abspath(p))), clean_path)


class VideoIngestionWorker:
    """One long-running worker for one camera configuration.

    Call ``run(stop_event)`` in a dedicated thread or process.  The worker
    reconnects until stopped whenever a connection cannot be opened or a stream
    read fails.
    """

    def __init__(
        self,
        camera: CameraConfig,
        raw_frame_queue: FrameQueue,
        *,
        capture_factory: Callable[[str | int], Any] | None = None,
        logger: logging.Logger | None = None,
        queue_timeout_seconds: float = 0.25,
        broadcast_fn: Callable[[dict[str, Any]], None] | None = None,
    ) -> None:
        self.camera = camera
        self.raw_frame_queue = raw_frame_queue
        self.capture_factory = capture_factory or self._opencv_capture
        self.log = logger or LOG
        self.queue_timeout_seconds = queue_timeout_seconds
        self.broadcast_fn = broadcast_fn

    @staticmethod
    def _opencv_capture(source: str | int) -> Any:
        if cv2 is None:
            raise RuntimeError("opencv-python is required. Install dependencies with: pip install -r requirements.txt")
        resolved = resolve_source(source)
        return cv2.VideoCapture(resolved)

    def run(self, stop_event: Event) -> None:
        """Run until ``stop_event`` is set or a non-looping video file ends."""
        while not stop_event.is_set():
            capture = self._connect()
            if capture is None:
                self._wait_to_reconnect(stop_event)
                continue
            try:
                should_reconnect = self._consume_capture(capture, stop_event)
            except Exception:
                self.log.exception("Unexpected ingestion error for camera=%s", self.camera.camera_id)
                should_reconnect = True
            finally:
                capture.release()
                self.log.info("Source disconnected: camera=%s", self.camera.camera_id)

            if not should_reconnect or stop_event.is_set():
                break
            self._wait_to_reconnect(stop_event)

    def _connect(self) -> Any | None:
        try:
            capture = self.capture_factory(self.camera.source_identifier)
            if not capture.isOpened():
                capture.release()
                self.log.warning("Connection failed: camera=%s source=%r", self.camera.camera_id, self.camera.source_identifier)
                return None
            self.log.info("Source connected: camera=%s source=%r", self.camera.camera_id, self.camera.source_identifier)
            return capture
        except Exception:
            self.log.exception("Connection error: camera=%s source=%r", self.camera.camera_id, self.camera.source_identifier)
            return None

    def _consume_capture(self, capture: Any, stop_event: Event) -> bool:
        source_fps = float(capture.get(cv2.CAP_PROP_FPS)) if cv2 is not None else 0.0
        if source_fps <= 0 or source_fps != source_fps or source_fps > 120:  # zero / NaN occur on live feeds
            source_fps = self.camera.source_fps_fallback
            self.log.warning("Source FPS unavailable: camera=%s; using fallback=%s", self.camera.camera_id, source_fps)
        
        sampler = FrameSampler(source_fps, self.camera.processing_fps)
        frame_number = 0
        frame_interval = 1.0 / source_fps
        last_frame_time = time.monotonic()
        is_file = self.camera.source_type == "file"

        while not stop_event.is_set():
            if is_file:
                now = time.monotonic()
                sleep_duration = frame_interval - (now - last_frame_time)
                if sleep_duration > 0:
                    if stop_event.wait(sleep_duration):
                        break
                last_frame_time = time.monotonic()

            ok, frame = capture.read()
            if not ok or frame is None:
                if is_file and self.camera.loop_file:
                    capture.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                if is_file and not self.camera.loop_file:
                    self.log.info("Recorded video finished: camera=%s", self.camera.camera_id)
                    return False
                self.log.warning("Source unavailable while reading: camera=%s", self.camera.camera_id)
                return True

            frame_number += 1
            if not sampler.take(frame_number):
                continue

            payload = self._build_payload(frame, frame_number, source_fps)
            self.log.debug("Frame sampled: camera=%s frame=%s", self.camera.camera_id, frame_number)
            self._put(payload)
        return False

    def _build_payload(self, frame: Any, frame_number: int, source_fps: float) -> dict[str, Any]:
        height, width = frame.shape[:2]
        return {
            "camera_id": self.camera.camera_id,
            "camera_name": self.camera.camera_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "frame_number": frame_number,
            "sampled_frame": frame,
            "frame_encoding": "numpy.ndarray_bgr",
            "source_type": self.camera.source_type,
            "source_identifier": self.camera.source_identifier,
            "frame_dimensions": {"width": width, "height": height},
            "original_fps": source_fps,
            "processing_fps": self.camera.processing_fps,
            "floor": self.camera.floor,
            "location": self.camera.location,
            "enabled_features": self.camera.enabled_features,
        }

    def _put(self, payload: dict[str, Any]) -> None:
        if self.broadcast_fn is not None:
            self.broadcast_fn(payload)
            self.log.debug("Frame broadcasted: camera=%s frame=%s", self.camera.camera_id, payload["frame_number"])
            return

        try:
            self.raw_frame_queue.put(payload, timeout=self.queue_timeout_seconds)
            self.log.debug("Frame pushed to raw queue: camera=%s frame=%s", self.camera.camera_id, payload["frame_number"])
        except queue_module.Full:
            try:
                # Maintain real-time freshness by dropping the oldest stale frame
                self.raw_frame_queue.get_nowait()
                self.raw_frame_queue.put_nowait(payload)
                self.log.warning("Raw frame queue full; dropped oldest frame for camera=%s", self.camera.camera_id)
            except Exception:
                self.log.warning("Raw frame queue full; dropping sampled frame: camera=%s frame=%s", self.camera.camera_id, payload["frame_number"])

    def _wait_to_reconnect(self, stop_event: Event) -> None:
        self.log.info("Reconnection attempt scheduled: camera=%s delay=%ss", self.camera.camera_id, self.camera.reconnect_delay_seconds)
        stop_event.wait(self.camera.reconnect_delay_seconds)

    @staticmethod
    def payload_to_json(payload: Mapping[str, Any], jpeg_quality: int = 90) -> str:
        """Return a transport-safe Raw Frame JSON message with a JPEG frame."""
        if cv2 is None:
            raise RuntimeError("opencv-python is required for JSON frame encoding")
        success, buffer = cv2.imencode(".jpg", payload["sampled_frame"], [cv2.IMWRITE_JPEG_QUALITY, jpeg_quality])
        if not success:
            raise ValueError("Could not encode sampled frame as JPEG")
        serializable = dict(payload)
        serializable["sampled_frame"] = base64.b64encode(buffer.tobytes()).decode("ascii")
        serializable["frame_encoding"] = "base64_jpeg"
        return json.dumps(serializable)
