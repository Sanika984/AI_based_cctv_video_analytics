# AI_based_cctv_video_analytics

- The goal of this project is to design and implement an intelligent CCTV video analytics system that can automatically monitor surveillance footage and generate meaningful security alerts without human supervision. The system processes live or recorded CCTV videos and analyzes them in real time to identify potential safety and security events.
The system works by first reading CCTV footage and breaking it into frames. These frames are cleaned and standardized, after which an AI-based object detection model identifies important objects such as people, bags, weapons, fire, and vehicles. The system then tracks these objects across time to understand movement and behavior instead of treating each frame independently.
- Based on this information, independent analytic modules analyze different scenarios such as weapon presence, fire outbreaks, intrusion into restricted areas, unattended objects, suspicious behavior, and license plate identification. Each module focuses on a specific security use case and generates an event only when predefined conditions are satisfied, ensuring reliable detection.
- All detected events are consolidated by a central event management component that removes duplicate alerts, validates events over time, and assigns priority levels. The final outputs are displayed on a dashboard that shows real-time alerts, event logs, timestamps, and visual evidence, allowing easy monitoring and review.

## Setup

### 1. Clone the Repository
```
git clone https://github.com/Sanika984/AI_based_cctv_video_analytics.git
cd AI_based_cctv_video_analytics
```

### 2. Install uv (if not already installed)
```
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 3. Create Virtual Environment
```
uv venv
```

### 4. Activate Virtual Environment (Mac / Linux)
```
source .venv/bin/activate
```

### Windows
```
.venv\Scripts\activate
```

### 5. Install Dependencies
```
uv sync
```

### 6. Run the App
```
streamlit run frontend/streamlit_app.py
```
---
