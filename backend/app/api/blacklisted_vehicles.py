from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.db.connection import SessionLocal
from app.models.blacklisted_vehicle import BlacklistedVehicle
from app.schemas.blacklisted_vehicles import (
    BlacklistedVehicleCreate,
    BlacklistedVehicleUpdate
)

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def generate_vehicle_id() -> str:
    return f"BV-{uuid.uuid4().hex[:6].upper()}"


def format_vehicle_response(vehicle: BlacklistedVehicle) -> dict:
    return {
        "id": vehicle.id,
        "plate_number": vehicle.plate_number,
        "reason": vehicle.reason,
        "added_by": vehicle.added_by,
        "added_at": vehicle.added_at,
        "is_active": vehicle.is_active
    }


# 1. GET ALL BLACKLISTED VEHICLES
@router.get("/", status_code=status.HTTP_200_OK)
def get_blacklisted_vehicles(
    db: Session = Depends(get_db)
):
    vehicles = db.query(BlacklistedVehicle).all()

    return [
        format_vehicle_response(vehicle)
        for vehicle in vehicles
    ]


# 2. GET BLACKLISTED VEHICLE BY ID
@router.get("/{vehicle_id}", status_code=status.HTTP_200_OK)
def get_blacklisted_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db)
):
    vehicle = (
        db.query(BlacklistedVehicle)
        .filter(BlacklistedVehicle.id == vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blacklisted vehicle not found"
        )

    return format_vehicle_response(vehicle)


# 3. ADD NEW BLACKLISTED VEHICLE
@router.post("/", status_code=status.HTTP_201_CREATED)
def create_blacklisted_vehicle(
    payload: BlacklistedVehicleCreate,
    db: Session = Depends(get_db)
):
    try:
        # Check if the plate number already exists
        existing_vehicle = (
            db.query(BlacklistedVehicle)
            .filter(
                BlacklistedVehicle.plate_number
                == payload.plate_number
            )
            .first()
        )

        if existing_vehicle:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Vehicle with this plate number already exists"
            )

        vehicle_id = generate_vehicle_id()

        new_vehicle = BlacklistedVehicle(
            id=vehicle_id,
            plate_number=payload.plate_number,
            reason=payload.reason,
            added_by=payload.added_by,
            added_at=datetime.utcnow(),
            is_active=payload.is_active
        )

        db.add(new_vehicle)
        db.commit()

        return {
            "message": "Blacklisted vehicle added successfully",
            "vehicle_id": vehicle_id
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# 4. UPDATE BLACKLISTED VEHICLE BY ID
@router.put("/{vehicle_id}", status_code=status.HTTP_200_OK)
def update_blacklisted_vehicle(
    vehicle_id: str,
    payload: BlacklistedVehicleUpdate,
    db: Session = Depends(get_db)
):
    vehicle = (
        db.query(BlacklistedVehicle)
        .filter(BlacklistedVehicle.id == vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blacklisted vehicle not found"
        )

    try:
        # Check if the new plate number belongs to another vehicle
        existing_vehicle = (
            db.query(BlacklistedVehicle)
            .filter(
                BlacklistedVehicle.plate_number
                == payload.plate_number,
                BlacklistedVehicle.id != vehicle_id
            )
            .first()
        )

        if existing_vehicle:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Vehicle with this plate number already exists"
            )

        vehicle.plate_number = payload.plate_number
        vehicle.reason = payload.reason
        vehicle.added_by = payload.added_by
        vehicle.is_active = payload.is_active

        db.commit()

        return {
            "message": "Blacklisted vehicle updated successfully",
            "vehicle_id": vehicle_id
        }

    except HTTPException:
        raise

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# 5. DELETE BLACKLISTED VEHICLE BY ID
@router.delete(
    "/{vehicle_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_blacklisted_vehicle(
    vehicle_id: str,
    db: Session = Depends(get_db)
):
    vehicle = (
        db.query(BlacklistedVehicle)
        .filter(BlacklistedVehicle.id == vehicle_id)
        .first()
    )

    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Blacklisted vehicle not found"
        )

    try:
        db.delete(vehicle)
        db.commit()

        return None

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )