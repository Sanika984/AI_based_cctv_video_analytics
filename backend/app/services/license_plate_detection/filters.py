"""Image Preprocessing, Validation Filters, and Quality Scoring for License Plate Detection & OCR.

Provides computer vision algorithms to normalize plate crop illumination, reduce noise,
enhance character edges, compute spatial IoU, calculate image sharpness, and validate/clean
extracted OCR registration plate strings for parking and CCTV security analytics.
"""

from __future__ import annotations

import re
from typing import List, Optional, Tuple

import cv2
import numpy as np


def calculate_iou(box_a: List[int], box_b: List[int]) -> float:
    """Calculate Intersection-over-Union (IoU) between two bounding boxes [x1, y1, x2, y2]."""
    x_a = max(box_a[0], box_b[0])
    y_a = max(box_a[1], box_b[1])
    x_b = min(box_a[2], box_b[2])
    y_b = min(box_a[3], box_b[3])

    intersection_w = max(0, x_b - x_a)
    intersection_h = max(0, y_b - y_a)
    intersection_area = intersection_w * intersection_h

    area_a = max(0, box_a[2] - box_a[0]) * max(0, box_a[3] - box_a[1])
    area_b = max(0, box_b[2] - box_b[0]) * max(0, box_b[3] - box_b[1])
    union_area = float(area_a + area_b - intersection_area)

    if union_area <= 0:
        return 0.0
    return intersection_area / union_area


def calculate_centroid_distance(box_a: List[int], box_b: List[int]) -> float:
    """Calculate Euclidean distance between centers of two boxes."""
    c_ax = (box_a[0] + box_a[2]) / 2.0
    c_ay = (box_a[1] + box_a[3]) / 2.0
    c_bx = (box_b[0] + box_b[2]) / 2.0
    c_by = (box_b[1] + box_b[3]) / 2.0
    return float(np.sqrt((c_ax - c_bx) ** 2 + (c_ay - c_by) ** 2))


def calculate_image_sharpness(img: np.ndarray) -> float:
    """Calculate image sharpness using the variance of the Laplacian."""
    if img is None or img.size == 0:
        return 0.0
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def is_valid_plate_geometry(
    box: List[int],
    frame_w: int,
    frame_h: int
) -> bool:
    """Verify license plate bounding box dimensions and aspect ratio."""
    x1, y1, x2, y2 = box
    w = x2 - x1
    h = y2 - y1

    if w < 10 or h < 5:
        return False

    aspect_ratio = w / float(max(1, h))
    if aspect_ratio < 0.9 or aspect_ratio > 9.0:
        return False

    frame_area = frame_w * frame_h
    box_area = w * h
    if frame_area > 0 and (box_area / frame_area) > 0.50:
        return False

    return True


def crop_plate_with_padding(
    frame: np.ndarray,
    box: List[int],
    pad_pct: float = 0.08
) -> np.ndarray:
    """Crop the bounding box with extra padding margin to prevent clipping characters."""
    h, w = frame.shape[:2]
    x1, y1, x2, y2 = box
    bw = x2 - x1
    bh = y2 - y1

    pad_x = max(2, int(bw * pad_pct))
    pad_y = max(2, int(bh * pad_pct))

    crop_x1 = max(0, x1 - pad_x)
    crop_y1 = max(0, y1 - pad_y)
    crop_x2 = min(w, x2 + pad_x)
    crop_y2 = min(h, y2 + pad_y)

    crop = frame[crop_y1:crop_y2, crop_x1:crop_x2]
    return crop


def preprocess_plate_image(plate_img: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """Preprocess license plate crop for OCR.
    
    Returns:
        enhanced_color: Upscaled & contrast-enhanced image.
        processed_gray: Noise-filtered, CLAHE-enhanced grayscale image optimized for character recognition.
    """
    if plate_img is None or plate_img.size == 0:
        return plate_img, plate_img

    h, w = plate_img.shape[:2]

    # Upscale if small so character strokes are distinct
    target_h = max(h, 90)
    target_w = max(w, 240)
    scale_y = target_h / float(h)
    scale_x = target_w / float(w)
    scale = max(scale_x, scale_y)
    if scale > 1.0:
        plate_img = cv2.resize(plate_img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_CUBIC)

    # Convert to Grayscale
    if len(plate_img.shape) == 3:
        gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
    else:
        gray = plate_img.copy()

    # CLAHE for illumination normalization
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    contrast_enhanced = clahe.apply(gray)

    # Bilateral Filter to smooth noise while preserving sharp character contours
    bilateral = cv2.bilateralFilter(contrast_enhanced, d=9, sigmaColor=75, sigmaSpace=75)

    return plate_img, bilateral


def clean_plate_text(raw_text: str) -> str:
    """Sanitize and normalize extracted OCR license plate text."""
    if not raw_text:
        return ""

    cleaned = raw_text.strip().upper()
    cleaned = re.sub(r'[^A-Z0-9\-]', '', cleaned)
    cleaned = re.sub(r'\-+', '-', cleaned).strip('-')

    if len(cleaned) < 3 or len(cleaned) > 14:
        return ""

    return cleaned


def is_valid_license_plate_text(text: str) -> bool:
    """Validate that the extracted string looks like a genuine vehicle registration plate.
    
    Rejects short noise artifacts (e.g. 'ZQZ', '123', 'OGDI') that lack the standard
    alphanumeric structure of vehicle registration numbers.
    """
    if not text:
        return False

    clean = re.sub(r'[^A-Z0-9]', '', text.upper())
    if len(clean) < 4 or len(clean) > 13:
        return False

    # Count letters and digits
    letters = sum(1 for c in clean if c.isalpha())
    digits = sum(1 for c in clean if c.isdigit())

    # Genuine registration plates have both letters and digits (e.g. MH12AB1234, KA02MM9091, TX5512L)
    if letters == 0 or digits == 0:
        return False

    # Reject repetitive noise strings (e.g. 'AAAA1111')
    if len(set(clean)) < 3:
        return False

    return True
