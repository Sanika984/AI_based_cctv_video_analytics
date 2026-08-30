"""Unit tests for Fire Detection computer vision filters and track state machine."""

import numpy as np
import pytest
from app.services.fire_detection.filters import (
    calculate_iou,
    calculate_motion_flicker,
    is_valid_bounding_box_geometry,
    verify_fire_chrominance,
)
from app.services.fire_detection.worker import FireTrack


def test_calculate_iou():
    box1 = [0, 0, 100, 100]
    box2 = [0, 0, 100, 100]
    assert calculate_iou(box1, box2) == 1.0

    box3 = [50, 0, 150, 100]
    iou = calculate_iou(box1, box3)
    assert 0.30 <= iou <= 0.35

    box4 = [200, 200, 300, 300]
    assert calculate_iou(box1, box4) == 0.0


def test_verify_fire_chrominance_fire_patch():
    # Synthetic intense flame patch (BGR: B=10, G=90, R=240)
    flame_patch = np.zeros((50, 50, 3), dtype=np.uint8)
    flame_patch[:, :] = (10, 90, 240)

    passed, ratio = verify_fire_chrominance(flame_patch)
    assert passed is True
    assert ratio > 0.8


def test_verify_fire_chrominance_non_fire_patches():
    # 1. White light glare (BGR: 255, 255, 255)
    white_glare = np.full((50, 50, 3), 255, dtype=np.uint8)
    passed, ratio = verify_fire_chrominance(white_glare)
    assert passed is False

    # 2. Blue sky / office element (BGR: 240, 100, 20)
    blue_patch = np.full((50, 50, 3), (240, 100, 20), dtype=np.uint8)
    passed, ratio = verify_fire_chrominance(blue_patch)
    assert passed is False

    # 3. Neutral gray wall (BGR: 140, 140, 140)
    gray_patch = np.full((50, 50, 3), 140, dtype=np.uint8)
    passed, ratio = verify_fire_chrominance(gray_patch)
    assert passed is False


def test_motion_flicker_static_vs_dynamic():
    static_crop_1 = np.full((60, 60, 3), (30, 30, 220), dtype=np.uint8)
    static_crop_2 = np.full((60, 60, 3), (30, 30, 220), dtype=np.uint8)

    # Identical crops (e.g. stationary fire extinguisher / red sign)
    is_dynamic, score = calculate_motion_flicker(static_crop_2, static_crop_1)
    assert is_dynamic is False
    assert score < 1.0

    # Dynamic flickering crop (simulating turbulent flame change)
    dynamic_crop = static_crop_1.copy()
    dynamic_crop[10:40, 10:40] = (10, 180, 255)
    is_dynamic, score = calculate_motion_flicker(dynamic_crop, static_crop_1)
    assert is_dynamic is True
    assert score > 5.0


def test_bounding_box_geometry():
    frame_w, frame_h = 1280, 720
    # Valid box
    assert is_valid_bounding_box_geometry([100, 100, 200, 200], frame_w, frame_h) is True
    # Too small (noise speck)
    assert is_valid_bounding_box_geometry([10, 10, 15, 15], frame_w, frame_h) is False
    # Huge box (glitch spanning whole screen)
    assert is_valid_bounding_box_geometry([0, 0, 1280, 720], frame_w, frame_h) is False


def test_fire_track_confirmation_lifecycle():
    initial_crop = np.full((50, 50, 3), (10, 90, 240), dtype=np.uint8)
    track = FireTrack(
        track_id="t1",
        box=[100, 100, 150, 150],
        confidence=0.55,
        cls_name="fire",
        crop=initial_crop,
        color_passed=True
    )

    # Initially candidate, not confirmed
    assert track.is_confirmed is False

    # Update 1: Dynamic flicker + color passed
    turbulent_crop_1 = initial_crop.copy()
    turbulent_crop_1[10:30, 10:30] = (20, 150, 255)
    track.update([102, 98, 152, 148], 0.60, turbulent_crop_1, color_passed=True, is_dynamic=True)
    assert track.consecutive_hits == 2

    # Update 2: Sustained dynamic detection -> should reach confirmation
    turbulent_crop_2 = turbulent_crop_1.copy()
    turbulent_crop_2[20:45, 15:35] = (5, 80, 220)
    track.update([101, 99, 151, 149], 0.62, turbulent_crop_2, color_passed=True, is_dynamic=True)
    assert track.consecutive_hits == 3
    assert track.is_confirmed is True
