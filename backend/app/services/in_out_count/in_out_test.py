from backend.app.services.in_out_count.line_setup import select_line
from backend.app.services.in_out_count.people_counting import count_people

video_path = "/Users/chaitanyashankar/Desktop/Projects/AI_Based_CCTV_video_analytics/videos/p.mp4"
output_path = "output.mp4"
model_path = "yolo26n.pt"  # or your model

# Step 1: Select line
line = select_line(video_path)

# Step 2: Run counting
count_people(video_path, output_path, model_path, line)