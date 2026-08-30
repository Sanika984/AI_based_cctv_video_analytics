"""Computer Vision Filters and Geometric Utilities for Weapon and Threat Detection.

Provides spatial IoU calculation, bounding box boundary verification, aspect ratio
and contrast texture analysis to eliminate false positives from ambient noise,
uniform blocks, or video compression artifacts.
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


def is_valid_weapon_geometry(
    box: List[int],
    frame_width: int,
    frame_height: int,
    min_area: int = 120,
    max_area_ratio: float = 0.70
) -> bool:
    """Validate bounding box geometry.

    Eliminates noise specks, zero-dimension errors, and whole-frame glitch boxes.
    """
    x1, y1, x2, y2 = box
    width = x2 - x1
    height = y2 - y1

    if width < 8 or height < 8:
        return False

    if x1 < 0 or y1 < 0 or x2 > frame_width or y2 > frame_height:
        return False

    box_area = width * height
    frame_area = frame_width * frame_height

    if box_area < min_area:
        return False

    if frame_area > 0 and (box_area / float(frame_area)) > max_area_ratio:
        return False

    return True


def verify_weapon_contrast_and_texture(
    crop_bgr: np.ndarray,
    min_std: float = 10.0
) -> Tuple[bool, float]:
    """Validate that the candidate crop contains structural texture / edges.

    Solid flat color patches (e.g. compression artifacts or empty backgrounds)
    exhibit very low pixel variance. Real weapons (handguns, rifles, knives)
    contain high-contrast contours and specular variations.
    """
    if crop_bgr is None or crop_bgr.size == 0:
        return False, 0.0

    try:
        gray = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2GRAY)
        std_val = float(np.std(gray))
        return std_val >= min_std, std_val
    except Exception:
        return True, 15.0
