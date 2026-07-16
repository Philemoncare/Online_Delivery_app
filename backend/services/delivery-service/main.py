from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from typing import Dict, List

import models, schemas, database

app = FastAPI(title="fDA Delivery Service", version="1.0.0")

@app.get("/")
def root():
    return {"status": "fDA Delivery Service is running", "version": "1.0.0"}

# WebSocket manager for live tracking
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, delivery_id: str, websocket: WebSocket):
        await websocket.accept()
        if delivery_id not in self.active_connections:
            self.active_connections[delivery_id] = []
        self.active_connections[delivery_id].append(websocket)

    def disconnect(self, delivery_id: str, websocket: WebSocket):
        self.active_connections[delivery_id].remove(websocket)

    async def broadcast(self, delivery_id: str, message: dict):
        if delivery_id in self.active_connections:
            for connection in self.active_connections[delivery_id]:
                await connection.send_json(message)

manager = ConnectionManager()

@app.post("/api/v1/deliveries", response_model=schemas.DeliveryOut)
def create_delivery(order_id: UUID, db: Session = Depends(database.get_db)):
    # Create delivery record without rider initially
    db_delivery = models.Delivery(order_id=order_id, rider_id=None, status=models.DeliveryStatus.ASSIGNED)
    db.add(db_delivery)
    db.commit()
    db.refresh(db_delivery)
    return db_delivery

@app.get("/api/v1/deliveries/available", response_model=List[schemas.DeliveryOut])
def get_available_deliveries(db: Session = Depends(database.get_db)):
    return db.query(models.Delivery).filter(models.Delivery.rider_id == None).all()

@app.post("/api/v1/deliveries/{id}/accept", response_model=schemas.DeliveryOut)
def accept_delivery(id: UUID, rider_id: UUID, db: Session = Depends(database.get_db)):
    db_delivery = db.query(models.Delivery).filter(models.Delivery.delivery_id == id).first()
    if not db_delivery:
        # Fallback: maybe id was order_id
        db_delivery = db.query(models.Delivery).filter(models.Delivery.order_id == id, models.Delivery.rider_id == None).first()

    if not db_delivery:
        raise HTTPException(status_code=404, detail="Delivery job not found")

    db_delivery.rider_id = rider_id
    db.commit()
    db.refresh(db_delivery)
    return db_delivery

import httpx
import os

ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://order-service:8000")

@app.patch("/api/v1/deliveries/{id}/status", response_model=schemas.DeliveryOut)
async def update_delivery_status(id: UUID, status: models.DeliveryStatus, lat: float, lng: float, db: Session = Depends(database.get_db)):
    db_delivery = db.query(models.Delivery).filter(models.Delivery.delivery_id == id).first()
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")

    db_delivery.status = status
    db_delivery.current_lat = lat
    db_delivery.current_lng = lng

    if status == models.DeliveryStatus.PICKED_UP:
        db_delivery.picked_at = func.now()
        # Sync with Order Service
        await sync_order_status(db_delivery.order_id, "PICKED_UP")
    elif status == models.DeliveryStatus.DELIVERED:
        db_delivery.dropped_at = func.now()
        # Sync with Order Service
        await sync_order_status(db_delivery.order_id, "DELIVERED")

    db.commit()
    await manager.broadcast(str(id), {"status": status, "lat": lat, "lng": lng})
    return db_delivery

async def sync_order_status(order_id: UUID, status: str):
    async with httpx.AsyncClient() as client:
        try:
            # Note: In local dev, order-service is on port 8002
            url = f"http://localhost:8002/api/v1/orders/{order_id}/status"
            if os.getenv("DOCKER_CONTAINER"):
                url = f"{ORDER_SERVICE_URL}/api/v1/orders/{order_id}/status"

            await client.patch(
                url,
                json={"status": status},
                headers={"X-Internal-Key": "fDA_INTERNAL_SECRET_2024"}
            )
        except Exception as e:
            print(f"Failed to sync order status: {e}")

@app.get("/api/v1/deliveries/order/{order_id}", response_model=schemas.DeliveryOut)
def get_delivery_by_order(order_id: UUID, db: Session = Depends(database.get_db)):
    db_delivery = db.query(models.Delivery).filter(models.Delivery.order_id == order_id).first()
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Delivery not found for this order")
    return db_delivery

@app.get("/api/v1/deliveries/{id}/track", response_model=schemas.DeliveryOut)
def track_delivery(id: UUID, db: Session = Depends(database.get_db)):
    db_delivery = db.query(models.Delivery).filter(models.Delivery.delivery_id == id).first()
    if not db_delivery:
        raise HTTPException(status_code=404, detail="Delivery not found")
    return db_delivery

import json

@app.get("/api/v1/deliveries/rider/{rider_id}/summary")
def get_rider_summary(rider_id: UUID, db: Session = Depends(database.get_db)):
    deliveries = db.query(models.Delivery).filter(models.Delivery.rider_id == rider_id, models.Delivery.status == models.DeliveryStatus.DELIVERED).all()

    total_delivered = len(deliveries)
    # Assume flat rate commission per delivery for now
    total_earnings = total_delivered * 12.50

    return {
        "count": total_delivered,
        "earnings": float(total_earnings)
    }

@app.websocket("/ws/deliveries/{id}")
async def websocket_endpoint(websocket: WebSocket, id: str):
    await manager.connect(id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                if payload.get("type") == "LOCATION_UPDATE":
                    lat = payload.get("lat")
                    lng = payload.get("lng")
                    # Broadcast location to all listeners for this delivery
                    await manager.broadcast(id, {
                        "type": "LOCATION_UPDATE",
                        "lat": lat,
                        "lng": lng
                    })
            except Exception as e:
                print(f"WS Error: {e}")
    except WebSocketDisconnect:
        manager.disconnect(id, websocket)
