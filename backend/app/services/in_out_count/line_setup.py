import cv2

line_points = []

def select_line(video_path):
    global line_points

    cap = cv2.VideoCapture(video_path)
    ret, frame = cap.read()
    cap.release()

    if not ret:
        raise Exception("Failed to read video")

    def mouse_callback(event, x, y, flags, param):
        global line_points
        if event == cv2.EVENT_LBUTTONDOWN:
            if len(line_points) < 2:
                line_points.append((x, y))
                print(f"Point selected: {(x, y)}")

    cv2.namedWindow("Select Line")
    cv2.setMouseCallback("Select Line", mouse_callback)

    while True:
        temp = frame.copy()

        for p in line_points:
            cv2.circle(temp, p, 5, (0, 0, 255), -1)

        if len(line_points) == 2:
            cv2.line(temp, line_points[0], line_points[1], (255, 0, 0), 2)

        cv2.imshow("Select Line", temp)

        key = cv2.waitKey(1)
        if key == 27:  # ESC
            break

    cv2.destroyAllWindows()

    if len(line_points) != 2:
        raise Exception("You must select exactly 2 points")

    return line_points