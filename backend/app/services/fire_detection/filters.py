"""Computer Vision Filters and Geometric Utilities for Fire Detection.

Implements color chrominance verification (HSV/YCrCb/RGB), dynamic motion/flicker
analysis via frame differencing, and spatial IoU matching to eliminate false positives
from ambient lights, static red/orange objects (fire extinguishers, signs), and glitches.
"""

from __future__ import annotations

from typing import List, Optional, Tuple
import cv2
import numpy as np


def calculate_iou(box_a: List[int], box_b: List[int]) -> float:
    """Calculate Intersection over Union (IoU) between two bounding boxes.

    Boxes are in format [x1, y1, x2, y2].
    """
    x_a = max(box_a[0], box_b[0])
    y_a = max(box_a[1], box_b[1])
    x_b = min(box_a[2], box_b[2])
    y_b = min(box_a[3], box_b[3])

    inter_width = max(0, x_b - x_a)
    inter_height = max(0, y_b - y_a)
    inter_area = inter_width * inter_height

    area_a = max(0, (box_a[2] - box_a[0])) * max(0, (box_a[3] - box_a[1]))
    area_b = max(0, (box_b[2] - box_b[0])) * max(0, (box_b[3] - box_b[1]))

    union_area = float(area_a + area_b - inter_area)
    if union_area <= 0:
        return 0.0

    return inter_area / union_area


def verify_fire_chrominance(
    crop_bgr: np.ndarray,
    min_fire_ratio: float = 0.08,
    is_smoke: bool = False
) -> Tuple[bool, float]:
    """Verify if the bounding box crop exhibits physical fire or smoke chrominance.

    Args:
        crop_bgr: Cropped BGR image of the detection.
        min_fire_ratio: Minimum ratio of pixels matching fire color profiles.
        is_smoke: If true, applies smoke color heuristic (neutral gray/white/dark).

    Returns:
        (passed, match_ratio)
    """
    if crop_bgr is None or crop_bgr.size == 0:
        return False, 0.0

    total_pixels = crop_bgr.shape[0] * crop_bgr.shape[1]
    if total_pixels == 0:
        return False, 0.0

    # Smoke Profile: Low saturation, mid-range to high luminance
    if is_smoke:
        hsv = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2HSV)
        s_channel = hsv[:, :, 1]
        v_channel = hsv[:, :, 2]
        # Smoke pixels have low saturation and non-zero brightness
        smoke_mask = (s_channel < 75) & (v_channel > 50) & (v_channel < 235)
        smoke_ratio = float(np.count_nonzero(smoke_mask)) / total_pixels
        return smoke_ratio >= 0.15, smoke_ratio

    # Fire / Flame Profile:
    # 1. RGB Rule: R > G > B and R > 130
    b = crop_bgr[:, :, 0].astype(np.int16)
    g = crop_bgr[:, :, 1].astype(np.int16)
    r = crop_bgr[:, :, 2].astype(np.int16)
    rgb_rule = (r > 130) & (r >= g) & (g >= b)

    # 2. HSV Rule: Hue in Red/Orange/Yellow spectrum with high Saturation and Value
    hsv = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2HSV)
    h = hsv[:, :, 0]
    s = hsv[:, :, 1]
    v = hsv[:, :, 2]
    hsv_rule = ((h <= 35) | (h >= 165)) & (s >= 85) & (v >= 120)

    # 3. YCrCb Rule: Y >= Cb, Cr >= Cb, Cr > 130
    ycrcb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2YCrCb)
    y_chan = ycrcb[:, :, 0]
    cr_chan = ycrcb[:, :, 1]
    cb_chan = ycrcb[:, :, 2]
    ycrcb_rule = (y_chan >= cb_chan) & (cr_chan >= cb_chan) & (cr_chan >= 130)

    # Combined Fire Pixel Mask: must satisfy (HSV OR RGB) AND YCrCb
    fire_mask = (hsv_rule | rgb_rule) & ycrcb_rule
    fire_pixels = np.count_nonzero(fire_mask)
    fire_ratio = float(fire_pixels) / float(total_pixels)

    return fire_ratio >= min_fire_ratio, fire_ratio


def calculate_motion_flicker(
    curr_crop_bgr: np.ndarray,
    prev_crop_bgr: Optional[np.ndarray],
    min_mean_diff: float = 3.0,
    min_std_diff: float = 3.5
) -> Tuple[bool, float]:
    """Measure structural dynamic flicker between successive crops of a candidate.

    Real fire and smoke flicker and change turbulence rapidly across frames.
    Stationary objects (fire extinguishers, red exit signs, heaters, lights)
    produce near-zero difference between frames.

    Args:
        curr_crop_bgr: Current frame bounding box crop.
        prev_crop_bgr: Previous frame bounding box crop (if available).
        min_mean_diff: Minimum average pixel difference for dynamic motion.
        min_std_diff: Minimum standard deviation of difference (spatial variance).

    Returns:
        (is_dynamic, flicker_intensity)
    """
    if prev_crop_bgr is None or curr_crop_bgr is None:
        # First frame seen -> neutral motion assumption
        return True, 10.0

    if prev_crop_bgr.size == 0 or curr_crop_bgr.size == 0:
        return True, 10.0

    try:
        # Standardize crops to 64x64 grayscale for fast normalized comparison
        target_size = (64, 64)
        curr_gray = cv2.cvtColor(cv2.resize(curr_crop_bgr, target_size), cv2.COLOR_BGR2GRAY)
        prev_gray = cv2.cvtColor(cv2.resize(prev_crop_bgr, target_size), cv2.COLOR_BGR2GRAY)

        # Absolute frame difference inside bounding box
        diff = cv2.absdiff(curr_gray, prev_gray)
        mean_diff = float(np.mean(diff))
        std_diff = float(np.std(diff))

        # Dynamic flicker condition
        is_dynamic = (mean_diff >= min_mean_diff) or (std_diff >= min_std_diff)
        flicker_score = mean_diff + std_diff
        return is_dynamic, flicker_score
    except Exception:
        return True, 10.0


def is_valid_bounding_box_geometry(
    box: List[int],
    frame_width: int,
    frame_height: int,
    min_size_px: int = 12,
    max_frame_fraction: float = 0.92
) -> bool:
    """Filter out noise specks (too small) or whole-frame glitches (too large)."""
    x1, y1, x2, y2 = box
    w = max(0, x2 - x1)
    h = max(0, y2 - y1)

    if w < min_size_px or h < min_size_px:
        return False

    if frame_width > 0 and frame_height > 0:
        if (w * h) > (frame_width * frame_height * max_frame_fraction):
            return False

    return True
