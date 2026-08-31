import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api import camera, analytics, users, stream, auth, blacklisted_vehicles


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Auto-start ingestion workers for all online cameras
    try:
        from app.db.connection import SessionLocal
        from app.models.camera import Camera
        from app.services.video_ingestion import ingestion_manager, CameraConfig
        
        db = SessionLocal()
        online_cams = db.query(Camera).filter(Camera.status == "Online").all()
        for cam in online_cams:
            clean_source = str(cam.source).strip()
            source_type = "webcam" if clean_source.isdigit() else ("rtsp" if clean_source.startswith(("rtsp://", "http://", "https://")) else "file")
            features = {f.feature_name: f.is_enabled for f in cam.features} if cam.features else {}
            if cam.modules:
                for m in cam.modules:
                    features[m.module_name] = True
            cfg = CameraConfig(
                camera_id=cam.camera_id,
                camera_name=cam.name,
                source_type=source_type,
                source_identifier=int(clean_source) if source_type == "webcam" else clean_source,
                processing_fps=float(getattr(cam, "processing_fps", 5.0) or 5.0),
                location=cam.location,
                enabled_features=features,
                loop_file=True
            )
            ingestion_manager.start_camera(cfg)
        # Start Fire Detection Inference Worker consuming from dedicated subscription queue
        from app.services.fire_detection import fire_inference_manager
        fire_inference_manager.start(ingestion_manager.subscribe())

        # Start Weapon Detection Inference Worker consuming from dedicated subscription queue
        from app.services.weapon_detection import weapon_inference_manager
        weapon_inference_manager.start(ingestion_manager.subscribe())

        # Start License Plate Detection & OCR Inference Worker consuming from dedicated subscription queue
        from app.services.license_plate_detection import license_plate_inference_manager
        license_plate_inference_manager.start(ingestion_manager.subscribe())
    except Exception as e:
        print(f"Startup camera ingestion/inference worker initialization error: {e}")
        
    yield
    
    # Shutdown: Stop all workers
    try:
        from app.services.license_plate_detection import license_plate_inference_manager
        license_plate_inference_manager.stop()
    except Exception:
        pass

    try:
        from app.services.weapon_detection import weapon_inference_manager
        weapon_inference_manager.stop()
    except Exception:
        pass

    try:
        from app.services.fire_detection import fire_inference_manager
        fire_inference_manager.stop()
    except Exception:
        pass

    try:
        from app.services.video_ingestion import ingestion_manager
        ingestion_manager.stop_all()
    except Exception:
        pass



app = FastAPI(lifespan=lifespan)

# Mount local snapshots directory for serving captured license plates
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
snapshots_dir = os.path.join(base_dir, "data", "snapshots")
os.makedirs(os.path.join(snapshots_dir, "plates"), exist_ok=True)
app.mount("/data/snapshots", StaticFiles(directory=snapshots_dir), name="snapshots")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"], # React Dev Server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(camera.router, prefix="/cameras", tags=["cameras"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(stream.router, prefix="/stream", tags=["stream"])
app.include_router(
    blacklisted_vehicles.router,
    prefix="/blacklisted-vehicles",
    tags=["blacklisted vehicles"]
)

@app.get("/")
def root():
    return {"message": "Backend is running"}