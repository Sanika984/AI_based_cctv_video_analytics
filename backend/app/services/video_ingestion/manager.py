"""Ingestion Manager to coordinate camera workers and central raw frame queue."""

from __future__ import annotations

import logging
from queue import Queue
from threading import Event, Thread
from typing import Any, Dict, Optional

from .worker import CameraConfig, VideoIngestionWorker

LOG = logging.getLogger(__name__)


class IngestionManager:
    """Manages long-running VideoIngestionWorker threads and the shared raw frame queue."""

    def __init__(self, max_queue_size: int = 500) -> None:
        self.raw_frame_queue: Queue[dict[str, Any]] = Queue(maxsize=max_queue_size)
        self._workers: Dict[str, VideoIngestionWorker] = {}
        self._threads: Dict[str, Thread] = {}
        self._stop_events: Dict[str, Event] = {}
        self._metrics: Dict[str, Dict[str, Any]] = {}

    def get_queue(self) -> Queue[dict[str, Any]]:
        """Return the shared raw frame queue consumed by AI analytics models."""
        return self.raw_frame_queue

    def start_camera(self, config: CameraConfig) -> None:
        """Start or restart an ingestion worker for the given camera configuration."""
        self.stop_camera(config.camera_id)

        stop_event = Event()
        worker = VideoIngestionWorker(config, self.raw_frame_queue)
        thread = Thread(
            target=worker.run,
            args=(stop_event,),
            daemon=True,
            name=f"ingestion-{config.camera_id}"
        )

        self._workers[config.camera_id] = worker
        self._stop_events[config.camera_id] = stop_event
        self._threads[config.camera_id] = thread
        self._metrics[config.camera_id] = {
            "camera_id": config.camera_id,
            "camera_name": config.camera_name,
            "processing_fps": config.processing_fps,
            "source_type": config.source_type,
            "source_identifier": str(config.source_identifier),
            "status": "running"
        }

        thread.start()
        LOG.info("Started video ingestion worker for camera=%s (processing_fps=%.1f)", config.camera_id, config.processing_fps)

    def stop_camera(self, camera_id: str) -> None:
        """Stop and cleanup the ingestion worker for a camera."""
        if camera_id in self._stop_events:
            self._stop_events[camera_id].set()
        
        if camera_id in self._threads:
            thread = self._threads[camera_id]
            if thread.is_alive() and thread != Thread():
                # Allow graceful exit without blocking server
                thread.join(timeout=1.0)
            del self._threads[camera_id]

        if camera_id in self._stop_events:
            del self._stop_events[camera_id]

        if camera_id in self._workers:
            del self._workers[camera_id]

        if camera_id in self._metrics:
            self._metrics[camera_id]["status"] = "stopped"

        LOG.info("Stopped video ingestion worker for camera=%s", camera_id)

    def get_camera_fps(self, camera_id: str) -> float:
        """Get the configured or current processing FPS for a camera."""
        if camera_id in self._workers:
            return float(self._workers[camera_id].camera.processing_fps)
        return 5.0

    def get_status(self) -> Dict[str, Any]:
        """Return a snapshot summary of all ingestion workers and queue load."""
        active_count = sum(1 for t in self._threads.values() if t.is_alive())
        return {
            "queue_size": self.raw_frame_queue.qsize(),
            "queue_maxsize": self.raw_frame_queue.maxsize,
            "active_workers_count": active_count,
            "cameras": list(self._metrics.values())
        }

    def stop_all(self) -> None:
        """Stop all running ingestion workers."""
        for cid in list(self._stop_events.keys()):
            self.stop_camera(cid)
        LOG.info("All video ingestion workers stopped.")


# Global singleton instance
ingestion_manager = IngestionManager()
