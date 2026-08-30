"""Unit tests for Weapon Detection Filters, Geometry, and Temporal Tracking."""

import numpy as np
from app.services.weapon_detection.filters import (
    calculate_iou,
    is_valid_weapon_geometry,
    verify_weapon_contrast_and_texture,
)
from app.services.weapon_detection.worker import (
    WeaponTrack,
    WeaponDetectionCache,
)


def test_calculate_iou_exact_and_disjoint():
    box_a = [100, 100, 200, 200]
    box_b = [100, 100, 200, 200]
    assert calculate_iou(box_a, box_b) == 1.0

    box_c = [300, 300, 400, 400]
    assert calculate_iou(box_a, box_c) == 0.0

    # 50% overlap horizontally
    box_d = [150, 100, 250, 200]
    # inter_area = 50 * 100 = 5000
    # union_area = 10000 + 10000 - 5000 = 15000 -> 5000/15000 = 0.3333...
    assert round(calculate_iou(box_a, box_d), 2) == 0.33


def test_is_valid_weapon_geometry():
    frame_w, frame_h = 1280, 720

    # Normal weapon box (e.g. 80x60 px)
    valid_box = [200, 200, 280, 260]
    assert is_valid_weapon_geometry(valid_box, frame_w, frame_h) is True

    # Micro speck (area < 120)
    tiny_box = [100, 100, 108, 108] # 8x8 = 64
    assert is_valid_weapon_geometry(tiny_box, frame_w, frame_h) is False

    # Out of bounds
    oob_box = [-10, 50, 100, 150]
    assert is_valid_weapon_geometry(oob_box, frame_w, frame_h) is False

    # Oversized glitch box (>70% of frame area)
    huge_box = [10, 10, 1270, 710]
    assert is_valid_weapon_geometry(huge_box, frame_w, frame_h) is False


def test_verify_weapon_contrast_and_texture():
    # Solid flat uniform patch (standard deviation = 0)
    flat_patch = np.full((64, 64, 3), 128, dtype=np.uint8)
    passed, std_val = verify_weapon_contrast_and_texture(flat_patch)
    assert passed is False
    assert std_val == 0.0

    # High texture patch (checkerboard / structured edges)
    noisy_patch = np.random.randint(0, 255, (64, 64, 3), dtype=np.uint8)
    passed, std_val = verify_weapon_contrast_and_texture(noisy_patch)
    assert passed is True
    assert std_val > 10.0


def test_weapon_track_temporal_confirmation():
    init_box = [100, 100, 160, 160]
    crop = np.random.randint(0, 255, (60, 60, 3), dtype=np.uint8)
    track = WeaponTrack(
        track_id="trk-1",
        box=init_box,
        confidence=0.75,
        cls_name="Gun",
        crop=crop
    )
    assert track.consecutive_hits == 1
    assert track.is_confirmed is False

    # 2nd hit with high confidence should confirm track
    new_box = [102, 101, 163, 162]
    track.update(new_box=new_box, new_conf=0.78, new_crop=crop, cls_name="Gun")
    assert track.consecutive_hits == 2
    assert track.is_confirmed is True


def test_weapon_detection_cache():
    cache = WeaponDetectionCache()
    cam_id = "CAM-WEAPON-01"

    # Initial state
    state = cache.get_camera_state(cam_id)
    assert state["weapon_detected"] is False
    assert state["threat_class"] == "Gun"

    # Update active detection
    cache.update_camera_state(
        camera_id=cam_id,
        weapon_detected=True,
        confidence=0.89,
        threat_class="Gun",
        boxes=[[120, 150, 200, 240]],
        is_active_alert=True
    )
    state = cache.get_camera_state(cam_id)
    assert state["weapon_detected"] is True
    assert state["confidence"] == 0.89
    assert state["is_active_alert"] is True
    assert len(state["boxes"]) == 1

    # Remove camera
    cache.remove_camera(cam_id)
    state = cache.get_camera_state(cam_id)
    assert state["weapon_detected"] is False
