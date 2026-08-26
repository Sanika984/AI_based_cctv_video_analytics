## To run Backend
cd backend
uvicorn app.main:app --reload --port 8000

## To run Frontend
cd frontend
npm run dev

### Camera Routes
Get all the cameras - GET http://localhost:8000/api/cameras
Create a camera - POST http://localhost:8000/api/cameras
Update a camera - PUT http://localhost:8000/api/cameras/{camera_id}
Delete a camera - DELETE http://localhost:8000/api/cameras/{camera_id}
Get a camera - GET http://localhost:8000/api/cameras/{camera_id}

