"""License Plate Detection and ANPR Service Package."""

from .worker import (
    LicensePlateDetectionCache,
    LicensePlateInferenceManager,
    license_plate_cache,
    license_plate_inference_manager,
)

__all__ = [
    "license_plate_cache",
    "license_plate_inference_manager",
    "LicensePlateDetectionCache",
    "LicensePlateInferenceManager",
]
