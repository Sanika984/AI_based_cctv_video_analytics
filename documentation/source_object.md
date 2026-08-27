# Video Source Object

## Overview

The `source_object.json` file defines a common configuration structure for all supported video sources in the AI-Based CCTV Video Analytics System.

The system supports:

- RTSP-based IP/CCTV cameras
- Webcams
- Recorded video files

The same structure is used for all video sources, while source-specific fields are populated according to the source type.

## Camera Information

| Field | Description |
|---|---|
| `camera_id` | Unique identifier assigned to the camera |
| `camera_name` | Human-readable name of the camera |
| `source` | Defines where the video comes from |
| `location` | Defines the physical location of the camera |
| `video` | Contains FPS and resolution information |
| `status` | Defines whether the camera is enabled |
| `analytics` | Contains configuration for available analytics modules |

## Source Types

### RTSP CCTV Camera

Used for IP-based CCTV cameras.

```json
{
  "type": "rtsp",
  "url": "rtsp://192.168.1.100:554/stream",
  "file_path": null,
  "device_index": null
}
