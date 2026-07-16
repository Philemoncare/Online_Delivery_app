from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

import httpx
import os
from celery import Celery
import models, schemas, database
from shared_security import verify_token

app = FastAPI(title="fDA Order Service", version="1.0.0")

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
        customer_id=UUID(auth_data["user_id"]),
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
                "order_id": str(db_order.order_id),
                "amount": float(db_order.total_amount),
                "provider": "MTN_MOMO", # Default for now
                "phone": "0000000000" # Should be in request or user profile
            }
            await client.post(f"{PAYMENT_SERVICE_URL}/api/v1/payments/initiate", json=payment_payload)
        except Exception as e:
            print(f"Failed to initiate payment: {e}")
            # In a production app, we might want to retry or mark order as failed

    return db_order

@app.get("/api/v1/orders", response_model=List[schemas.OrderOut])
def get_orders(restaurant_id: Optional[UUID] = None, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    query = db.query(models.Order)

    if auth_data["role"] == "vendor":
        # Strictly scope to the restaurant if provided, or return all for that vendor
        if restaurant_id:
            query = query.filter(models.Order.restaurant_id == restaurant_id)
        # Ideally we'd verify the owner_id here by calling restaurant-service
    elif auth_data["role"] == "customer":
        query = query.filter(models.Order.customer_id == UUID(auth_data["user_id"]))
    elif auth_data["role"] == "admin":
        if restaurant_id:
            query = query.filter(models.Order.restaurant_id == restaurant_id)

    return query.all()

@app.get("/api/v1/orders/{id}", response_model=schemas.OrderOut)
def get_order(id: UUID, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.order_id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.get("/api/v1/orders/{id}/status", response_model=schemas.OrderStatusUpdate)
def get_order_status(id: UUID, db: Session = Depends(database.get_db)):
    order = db.query(models.Order).filter(models.Order.order_id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"status": order.status}

@app.patch("/api/v1/orders/{id}/status", response_model=schemas.OrderOut)
async def update_order_status(id: UUID, status_update: schemas.OrderStatusUpdate, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    db_order = db.query(models.Order).filter(models.Order.order_id == id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Isolation & Permissions
    if auth_data["role"] == "vendor":
        # A vendor can only update their own restaurant's orders
        # For rapid dev, we assume trust but in production we'd verify the owner_id
        pass
    elif auth_data["role"] not in ["admin", "rider"]:
        raise HTTPException(status_code=403, detail="Unauthorized status update")

    # State Machine Logic (Architecture Diagram 6)
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

    # Allow Rider to bypass for rapid dev testing
    if status_update.status not in valid_transitions.get(db_order.status, []):
        # We'll allow it but log it
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

    # 9. Trigger Notification (Sequence Diagram Step 9 & 10)
    try:
        celery_app.send_task(
            "tasks.process_order_event",
            args=[f"order.{status_update.status.lower()}", {"order_id": str(id), "status": status_update.status, "customer_id": str(db_order.customer_id), "vendor_id": str(db_order.restaurant_id)}]
        )
    except Exception as e:
        print(f"Failed to publish to Celery: {e}")

    return db_order

@app.get("/api/v1/customers/{id}/orders", response_model=List[schemas.OrderOut])
def get_customer_orders(id: UUID, db: Session = Depends(database.get_db)):
    return db.query(models.Order).filter(models.Order.customer_id == id).all()

@app.post("/api/v1/orders/{id}/cancel", response_model=schemas.OrderOut)
def cancel_order(id: UUID, db: Session = Depends(database.get_db)):
    db_order = db.query(models.Order).filter(models.Order.order_id == id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if in grace window as per State Machine (Diagram 6)
    if db_order.status == models.OrderStatus.CONFIRMED:
        # Assuming CONFIRMED happened recently. In a real app, we'd store confirmed_at
        # For now, we'll check against placed_at + some buffer
        grace_period = timedelta(minutes=5)
        if datetime.utcnow() > (db_order.placed_at.replace(tzinfo=None) + grace_period):
            raise HTTPException(status_code=400, detail="Grace window for cancellation has expired")

    if db_order.status not in [models.OrderStatus.PENDING_PAYMENT, models.OrderStatus.PLACED, models.OrderStatus.CONFIRMED]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel order in {db_order.status} state")

    db_order.status = models.OrderStatus.CANCELLED
    db.commit()
    db.refresh(db_order)
    return db_order

# --- EXPENSE ENDPOINTS ---

@app.get("/api/v1/restaurants/{id}/sales-stats")
def get_restaurant_sales_stats(id: UUID, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    # Verify ownership (simulated check)
    if auth_data["role"] == "vendor":
        # In a real app, cross-service verify owner_id
        pass

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

    # Popular Foods (Top 5)
    popular = db.query(models.OrderItem.item_id, func.count(models.OrderItem.item_id))\
        .join(models.Order)\
        .filter(models.Order.restaurant_id == id)\
        .filter(models.Order.status != models.OrderStatus.CANCELLED)\
        .group_by(models.OrderItem.item_id)\
        .order_by(func.count(models.OrderItem.item_id).desc()).limit(5).all()

    # Revenue Trend (Last 7 Days)
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
        "popular_items": [{"id": str(p[0]), "count": p[1]} for p in popular],
        "revenue_trend": trend
    }

@app.get("/api/v1/expenses", response_model=List[schemas.ExpenseOut])
def get_expenses(restaurant_id: Optional[UUID] = None, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    query = db.query(models.Expense)
    if restaurant_id:
        # In production, verify that auth_data refers to the restaurant owner
        query = query.filter(models.Expense.restaurant_id == restaurant_id)
    return query.all()

@app.post("/api/v1/expenses", response_model=schemas.ExpenseOut)
def create_expense(expense: schemas.ExpenseCreate, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    db_expense = models.Expense(**expense.dict())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.delete("/api/v1/expenses/{id}")
def delete_expense(id: UUID, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    db_expense = db.query(models.Expense).filter(models.Expense.expense_id == id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(db_expense)
    db.commit()
    return {"status": "success"}

# --- DISPUTE ENDPOINTS ---

@app.post("/api/v1/disputes", response_model=schemas.DisputeOut)
def create_dispute(dispute: schemas.DisputeCreate, db: Session = Depends(database.get_db)):
    db_dispute = models.Dispute(**dispute.dict())
    db.add(db_dispute)
    db.commit()
    db.refresh(db_dispute)
    return db_dispute

@app.get("/api/v1/disputes", response_model=List[schemas.DisputeOut])
def get_all_disputes(db: Session = Depends(database.get_db)):
    return db.query(models.Dispute).all()

@app.patch("/api/v1/disputes/{id}/resolve", response_model=schemas.DisputeOut)
def resolve_dispute(id: UUID, db: Session = Depends(database.get_db)):
    db_dispute = db.query(models.Dispute).filter(models.Dispute.dispute_id == id).first()
    if not db_dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")
    db_dispute.status = "RESOLVED"
    db.commit()
    db.refresh(db_dispute)
    return db_dispute

@app.get("/api/v1/admin/restaurants-stats")
def get_all_restaurants_stats(auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    if auth_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    # Aggregated stats for all restaurants
    stats = db.query(
        models.Order.restaurant_id,
        func.count(models.Order.order_id).label('total_orders'),
        func.sum(models.Order.total_amount).label('total_revenue'),
        func.count(models.Order.order_id).filter(models.Order.status.in_(['DELIVERED', 'COMPLETED'])).label('completed_orders')
    ).group_by(models.Order.restaurant_id).all()

    return {
        str(s.restaurant_id): {
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
    start_of_week = today - timedelta(days=7)
    start_of_month = today.replace(day=1)

    # Determine start date based on range
    range_start = None
    if range == 'today':
        range_start = today
    elif range == 'week':
        range_start = start_of_week
    elif range == 'month':
        range_start = start_of_month

    # Helper for filtering
    def filter_range(q, col):
        if range_start:
            return q.filter(func.date(col) >= range_start)
        return q

    # Core Stats
    total_orders = filter_range(db.query(models.Order), models.Order.placed_at).count()
    total_revenue = filter_range(db.query(func.sum(models.Order.total_amount)), models.Order.placed_at).scalar() or 0

    # Commission (10%)
    platform_earnings = float(total_revenue) * 0.10

    # Orders Breakdown
    orders_by_status = filter_range(db.query(models.Order.status, func.count(models.Order.order_id)), models.Order.placed_at).group_by(models.Order.status).all()
    status_map = {status.name if hasattr(status, 'name') else str(status): count for status, count in orders_by_status}

    # Top Restaurants
    top_restaurants = filter_range(db.query(models.Order.restaurant_id, func.count(models.Order.order_id).label('count'), func.sum(models.Order.total_amount).label('rev')), models.Order.placed_at)\
        .group_by(models.Order.restaurant_id).order_by(func.count(models.Order.order_id).desc()).limit(5).all()

    # Sales Trend
    sales_trend = []
    for i in range(11, -1, -1):
        d = today - timedelta(days=i)
        val = db.query(func.sum(models.Order.total_amount)).filter(func.date(models.Order.placed_at) == d).scalar() or 0
        sales_trend.append({"date": d.strftime("%Y-%m-%d"), "amount": float(val)})

    # Top Riders
    top_riders = filter_range(db.query(models.Order.rider_id, func.count(models.Order.order_id).label('count')), models.Order.placed_at)\
        .filter(models.Order.rider_id != None)\
        .group_by(models.Order.rider_id).order_by(func.count(models.Order.order_id).desc()).limit(5).all()

    # Popular Items Platform-wide
    popular_items = filter_range(db.query(models.OrderItem.item_id, func.count(models.OrderItem.item_id).label('count')).join(models.Order), models.Order.placed_at)\
        .group_by(models.OrderItem.item_id).order_by(func.count(models.OrderItem.item_id).desc()).limit(5).all()

    # Today's Revenue (fixed for secondary stats)
    today_revenue = db.query(func.sum(models.Order.total_amount)).filter(func.date(models.Order.placed_at) == today).scalar() or 0

    return {
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
        "today_revenue": float(today_revenue),
        "platform_earnings": platform_earnings,
        "orders_by_status": status_map,
        "sales_trend": sales_trend,
        "top_restaurants": [{"id": str(r[0]), "orders": r[1], "revenue": float(r[2])} for r in top_restaurants],
        "top_riders": [{"id": str(r[0]), "deliveries": r[1]} for r in top_riders],
        "popular_items": [{"id": str(r[0]), "count": r[1]} for r in popular_items]
    }
