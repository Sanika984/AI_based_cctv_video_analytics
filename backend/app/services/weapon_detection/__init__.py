"""Weapon and Armed Threat Detection Service Module."""

from .worker import (
    WeaponDetectionWorker,
    WeaponInferenceManager,
    weapon_inference_manager,
    weapon_cache,
)

__all__ = [
    "WeaponDetectionWorker",
    "WeaponInferenceManager",
    "weapon_inference_manager",
    "weapon_cache",
]
