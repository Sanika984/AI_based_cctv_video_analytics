from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import camera, analytics, users, stream, auth

app = FastAPI()

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

@app.get("/")
def root():
    return {"message": "Backend is running"}