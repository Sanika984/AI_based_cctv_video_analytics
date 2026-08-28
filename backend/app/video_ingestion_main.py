"""Start ingestion workers and print sampled frame metadata for verification.

Replace the print section with your downstream queue consumer(s) once fire,
weapon, vehicle, or analytics workers are implemented.
"""

from __future__ import annotations

import logging
from queue import Queue
from threading import Event, Thread

from app.services.video_ingestion import VideoIngestionWorker, load_camera_configs


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )
    raw_frame_queue = Queue(maxsize=200)
    stop_event = Event()

    workers = [
        VideoIngestionWorker(camera, raw_frame_queue)
        for camera in load_camera_configs("camera_config.json")
    ]
    threads = [
        Thread(target=worker.run, args=(stop_event,), daemon=True, name=f"ingestion-{worker.camera.camera_id}")
        for worker in workers
    ]
    for thread in threads:
        thread.start()

    logging.info("Started %d ingestion worker(s). Press Ctrl+C to stop.", len(threads))
    try:
        # Demo consumer: proves that messages are arriving and prevents the
        # local queue from filling. Replace this with the next pipeline worker.
        while True:
            message = raw_frame_queue.get()
            logging.info(
                "Raw frame received | camera=%s | frame=%s | time=%s | size=%sx%s",
                message["camera_id"], message["frame_number"], message["timestamp"],
                message["frame_dimensions"]["width"], message["frame_dimensions"]["height"],
            )
    except KeyboardInterrupt:
        logging.info("Stopping ingestion workers...")
    finally:
        stop_event.set()
        for thread in threads:
            thread.join(timeout=10)


if __name__ == "__main__":
    main()
