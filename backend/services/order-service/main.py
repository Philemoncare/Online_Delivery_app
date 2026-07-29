from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict
from datetime import datetime, timedelta

import httpx
import os
import json
from celery import Celery
import models, schemas, database
from shared_security import verify_token

app = FastAPI(title="fDA Order Service", version="1.0.0")

# WebSocket Manager for Order Tracking
class OrderConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, group: str):
        await websocket.accept()
        if group not in self.active_connections:
            self.active_connections[group] = []
        self.active_connections[group].append(websocket)

    def disconnect(self, websocket: WebSocket, group: str):
        if group in self.active_connections:
            self.active_connections[group].remove(websocket)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict, group: str):
        if group in self.active_connections:
            for connection in self.active_connections[group]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = OrderConnectionManager()

@app.websocket("/ws/orders/{group}")
async def order_websocket_endpoint(websocket: WebSocket, group: str):
    await manager.connect(websocket, group)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, group)

@app.get("/")
def root():
    return {"status": "fDA Order Service is running", "version": "1.0.0"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_service_url(env_var, default_docker, local_port):
    if os.getenv("KUBERNETES_SERVICE_HOST") or os.getenv("DOCKER_CONTAINER"):
        return os.getenv(env_var, default_docker)
    return os.getenv(env_var, f"http://localhost:{local_port}")

PAYMENT_SERVICE_URL = get_service_url("PAYMENT_SERVICE_URL", "http://payment-service:8000", 8004)
RESTAURANT_SERVICE_URL = get_service_url("RESTAURANT_SERVICE_URL", "http://restaurant-service:8000", 8001)
DELIVERY_SERVICE_URL = get_service_url("DELIVERY_SERVICE_URL", "http://delivery-service:8000", 8003)
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
celery_app = Celery("notification_tasks", broker=CELERY_BROKER_URL)

@app.post("/api/v1/orders", response_model=schemas.OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(order: schemas.OrderCreate, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    # 3. Create order (status=PENDING_PAYMENT)
    db_order = models.Order(
        customer_id=auth_data["user_id"],
        restaurant_id=order.restaurant_id,
        status=models.OrderStatus.PENDING_PAYMENT,
        total_amount=order.total_amount,
        delivery_address=order.delivery_address,
        geo_lat=order.geo_lat,
        geo_lng=order.geo_lng
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    async with httpx.AsyncClient() as client:
        for item in order.items:
            # Reduce Stock in Restaurant Service and get cost_price
            cost_price = 0.00
            try:
                stock_res = await client.post(
                    f"{RESTAURANT_SERVICE_URL}/api/v1/menu-items/{item.item_id}/reduce-stock?quantity={item.quantity}"
                )
                if stock_res.status_code == 200:
                    cost_price = stock_res.json().get("cost_price", 0.00)
            except Exception as e:
                print(f"Failed to reduce stock for {item.item_id}: {e}")

            db_item = models.OrderItem(
                order_id=db_order.order_id,
                item_id=item.item_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                cost_price=cost_price
            )
            db.add(db_item)

    db.commit()
    db.refresh(db_order)

    # 4. Request payment (Sequence Diagram Step 4)
    async with httpx.AsyncClient() as client:
        try:
            payment_payload = {
                "order_id": db_order.order_id,
                "amount": float(db_order.total_amount),
                "provider": "MTN_MOMO", # Default for now
                "phone": "0000000000" # Should be in request or user profile
            }
            await client.post(f"{PAYMENT_SERVICE_URL}/api/v1/payments/initiate", json=payment_payload)
        except Exception as e:
            print(f"Failed to initiate payment: {e}")

    return db_order

@app.get("/api/v1/orders", response_model=List[schemas.OrderOut])
def get_orders(restaurant_id: Optional[str] = None, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    query = db.query(models.Order)

    if auth_data["role"] == "vendor":
        if restaurant_id:
            query = query.filter(models.Order.restaurant_id == restaurant_id)
    elif auth_data["role"] == "customer":
        query = query.filter(models.Order.customer_id == auth_data["user_id"])
    elif auth_data["role"] == "admin":
        if restaurant_id:
            query = query.filter(models.Order.restaurant_id == restaurant_id)

    return query.all()

@app.get("/api/v1/orders/{id}", response_model=schemas.OrderOut)
def get_order(id: str, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.order_id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.get("/api/v1/orders/{id}/status", response_model=schemas.OrderStatusUpdate)
def get_order_status(id: str, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.order_id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"status": order.status}

@app.patch("/api/v1/orders/{id}/status", response_model=schemas.OrderOut)
async def update_order_status(id: str, status_update: schemas.OrderStatusUpdate, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    db_order = db.query(models.Order).filter(models.Order.order_id == id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Isolation & Permissions
    if auth_data["role"] == "vendor":
        pass
    elif auth_data["role"] not in ["admin", "rider", "SYSTEM"]: # Added SYSTEM for inter-service
        raise HTTPException(status_code=403, detail="Unauthorized status update")

    # State Machine Logic
    valid_transitions = {
        models.OrderStatus.PENDING_PAYMENT: [models.OrderStatus.PLACED, models.OrderStatus.CANCELLED],
        models.OrderStatus.PLACED: [models.OrderStatus.CONFIRMED, models.OrderStatus.CANCELLED],
        models.OrderStatus.CONFIRMED: [models.OrderStatus.PREPARING, models.OrderStatus.CANCELLED],
        models.OrderStatus.PREPARING: [models.OrderStatus.READY_FOR_PICKUP],
        models.OrderStatus.READY_FOR_PICKUP: [models.OrderStatus.PICKED_UP],
        models.OrderStatus.PICKED_UP: [models.OrderStatus.DELIVERED],
        models.OrderStatus.DELIVERED: [models.OrderStatus.COMPLETED],
        models.OrderStatus.COMPLETED: [],
        models.OrderStatus.CANCELLED: []
    }

    if status_update.status not in valid_transitions.get(db_order.status, []):
        print(f"Warning: Unusual transition from {db_order.status} to {status_update.status}")

    db_order.status = status_update.status
    if status_update.status == models.OrderStatus.DELIVERED:
        db_order.delivered_at = func.now()

    if status_update.status == models.OrderStatus.READY_FOR_PICKUP:
        async with httpx.AsyncClient() as client:
            try:
                await client.post(f"{DELIVERY_SERVICE_URL}/api/v1/deliveries?order_id={id}")
            except Exception as e:
                print(f"Failed to create delivery: {e}")

    db.commit()
    db.refresh(db_order)

    # Broadcast via WebSockets
    status_msg = {
        "order_id": id,
        "status": status_update.status,
        "customer_id": db_order.customer_id,
        "restaurant_id": db_order.restaurant_id
    }
    await manager.broadcast(status_msg, f"order_{id}")
    await manager.broadcast(status_msg, f"customer_{db_order.customer_id}")
    await manager.broadcast(status_msg, f"vendor_{db_order.restaurant_id}")
    await manager.broadcast(status_msg, "admin")

    # Trigger Notification
    try:
        celery_app.send_task(
            "tasks.process_order_event",
            args=[f"order.{status_update.status.lower()}", {"order_id": id, "status": status_update.status, "customer_id": db_order.customer_id, "vendor_id": db_order.restaurant_id}]
        )
    except Exception as e:
        print(f"Failed to publish to Celery: {e}")

    return db_order

@app.get("/api/v1/customers/{id}/orders", response_model=List[schemas.OrderOut])
def get_customer_orders(id: str, db: Session = Depends(database.get_db)):
    return db.query(models.Order).filter(models.Order.customer_id == id).all()

@app.post("/api/v1/orders/{id}/cancel", response_model=schemas.OrderOut)
def cancel_order(id: str, db: Session = Depends(database.get_db)):
    db_order = db.query(models.Order).filter(models.Order.order_id == id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    if db_order.status not in [models.OrderStatus.PENDING_PAYMENT, models.OrderStatus.PLACED, models.OrderStatus.CONFIRMED]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order in {db_order.status} state")

    db_order.status = models.OrderStatus.CANCELLED
    db.commit()
    db.refresh(db_order)
    return db_order

@app.get("/api/v1/restaurants/{id}/sales-stats")
def get_restaurant_sales_stats(id: str, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    today = datetime.utcnow().date()
    start_of_week = today - timedelta(days=today.weekday())
    start_of_month = today.replace(day=1)

    all_orders = db.query(models.Order).filter(models.Order.restaurant_id == id).all()

    def sum_revenue(order_list):
        return sum(o.total_amount for o in order_list if o.status not in [models.OrderStatus.CANCELLED, models.OrderStatus.PENDING_PAYMENT])

    today_orders = [o for o in all_orders if o.placed_at.date() == today]
    weekly_orders = [o for o in all_orders if o.placed_at.date() >= start_of_week]
    monthly_orders = [o for o in all_orders if o.placed_at.date() >= start_of_month]

    completed_orders = [o for o in all_orders if o.status in [models.OrderStatus.DELIVERED, models.OrderStatus.COMPLETED]]
    cancelled_orders = [o for o in all_orders if o.status == models.OrderStatus.CANCELLED]
    active_orders = [o for o in all_orders if o.status not in [models.OrderStatus.DELIVERED, models.OrderStatus.COMPLETED, models.OrderStatus.CANCELLED, models.OrderStatus.PENDING_PAYMENT]]

    popular = db.query(models.OrderItem.item_id, func.count(models.OrderItem.item_id))\
        .join(models.Order)\
        .filter(models.Order.restaurant_id == id)\
        .filter(models.Order.status != models.OrderStatus.CANCELLED)\
        .group_by(models.OrderItem.item_id)\
        .order_by(func.count(models.OrderItem.item_id).desc()).limit(5).all()

    trend = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        rev = sum(o.total_amount for o in all_orders if o.placed_at.date() == d and o.status not in [models.OrderStatus.CANCELLED, models.OrderStatus.PENDING_PAYMENT])
        trend.append({"date": d.strftime("%Y-%m-%d"), "amount": float(rev)})

    return {
        "today_sales": float(sum_revenue(today_orders)),
        "weekly_sales": float(sum_revenue(weekly_orders)),
        "monthly_sales": float(sum_revenue(monthly_orders)),
        "total_revenue": float(sum_revenue(all_orders)),
        "avg_order_value": float(sum_revenue(all_orders) / len(completed_orders)) if completed_orders else 0,
        "total_order_count": len(all_orders),
        "completed_count": len(completed_orders),
        "cancelled_count": len(cancelled_orders),
        "active_order_count": len(active_orders),
        "popular_items": [{"id": p[0], "count": p[1]} for p in popular],
        "revenue_trend": trend
    }

@app.get("/api/v1/admin/restaurants-stats")
def get_all_restaurants_stats(auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    if auth_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    stats = db.query(
        models.Order.restaurant_id,
        func.count(models.Order.order_id).label('total_orders'),
        func.sum(models.Order.total_amount).label('total_revenue'),
        func.count(models.Order.order_id).filter(models.Order.status.in_(['DELIVERED', 'COMPLETED'])).label('completed_orders')
    ).group_by(models.Order.restaurant_id).all()

    return {
        s.restaurant_id: {
            "total_orders": s.total_orders,
            "total_revenue": float(s.total_revenue or 0),
            "completed_orders": s.completed_orders
        } for s in stats
    }

@app.get("/api/v1/admin/analytics")
async def get_analytics(range: str = 'all', auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    if auth_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    today = datetime.utcnow().date()
    range_start = None
    if range == 'today': range_start = today
    elif range == 'week': range_start = today - timedelta(days=7)
    elif range == 'month': range_start = today.replace(day=1)

    def filter_range(q, col):
        if range_start: return q.filter(func.date(col) >= range_start)
        return q

    total_orders = filter_range(db.query(models.Order), models.Order.placed_at).count()
    total_revenue = filter_range(db.query(func.sum(models.Order.total_amount)), models.Order.placed_at).scalar() or 0
    platform_earnings = float(total_revenue) * 0.10

    orders_by_status = filter_range(db.query(models.Order.status, func.count(models.Order.order_id)), models.Order.placed_at).group_by(models.Order.status).all()
    status_map = {status.name if hasattr(status, 'name') else str(status): count for status, count in orders_by_status}

    sales_trend = []
    for i in range(11, -1, -1):
        d = today - timedelta(days=i)
        val = db.query(func.sum(models.Order.total_amount)).filter(func.date(models.Order.placed_at) == d).scalar() or 0
        sales_trend.append({"date": d.strftime("%Y-%m-%d"), "amount": float(val)})

    return {
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
        "platform_earnings": platform_earnings,
        "orders_by_status": status_map,
        "sales_trend": sales_trend
    }
