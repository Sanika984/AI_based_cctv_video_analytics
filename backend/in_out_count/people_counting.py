import cv2
from ultralytics import YOLO

import cv2
from ultralytics import YOLO

def get_line_side(p, a, b):
    # Determines which side of the line the point lies on
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])


def count_people(video_path, output_path, model_path, line_points):
    model = YOLO(model_path)

    cap = cv2.VideoCapture(video_path)
    assert cap.isOpened(), "Error reading video"

    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))

    out = cv2.VideoWriter(
        output_path,
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (w, h)
    )

    track_history = {}
    counted_ids = set()

    in_count = 0
    out_count = 0

    line_p1, line_p2 = line_points

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        results = model.track(frame, persist=True, classes=[0])

        if results[0].boxes.id is not None:
            boxes = results[0].boxes.xyxy.cpu().numpy()
            ids = results[0].boxes.id.cpu().numpy()

            for box, track_id in zip(boxes, ids):
                track_id = int(track_id)

                x1, y1, x2, y2 = map(int, box)
                cx = int((x1 + x2) / 2)
                cy = int((y1 + y2) / 2)

                # Initialize history
                if track_id not in track_history:
                    track_history[track_id] = []

                track_history[track_id].append((cx, cy))

                # Keep only last 2 positions
                if len(track_history[track_id]) > 2:
                    track_history[track_id].pop(0)

                # Check crossing
                if len(track_history[track_id]) == 2 and track_id not in counted_ids:
                    prev_point = track_history[track_id][0]
                    curr_point = track_history[track_id][1]

                    prev_side = get_line_side(prev_point, line_p1, line_p2)
                    curr_side = get_line_side(curr_point, line_p1, line_p2)

                    # Crossing detected
                    if prev_side * curr_side < 0:
                        # Direction decision
                        if curr_side > prev_side:
                            in_count += 1
                        else:
                            out_count += 1

                        counted_ids.add(track_id)

                # Draw bounding box + centroid
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                cv2.circle(frame, (cx, cy), 4, (0, 0, 255), -1)
                cv2.putText(frame, f"ID:{track_id}", (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 2)

        # Draw counting line
        cv2.line(frame, line_p1, line_p2, (255, 0, 0), 3)

        # Display counts
        cv2.putText(frame, f"IN: {in_count}", (20, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f"OUT: {out_count}", (20, 100),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        out.write(frame)
        cv2.imshow("Counting", frame)

        if cv2.waitKey(1) & 0xFF == 27:
            break

    cap.release()
    out.release()
    cv2.destroyAllWindows()

    print("Final Count -> IN:", in_count, "OUT:", out_count)
    
def get_line_side(p, a, b):
    # Returns positive or negative depending on side
    return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])