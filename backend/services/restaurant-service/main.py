from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict
from datetime import datetime, timedelta
import json
import shutil
import os

import models, schemas, database
from shared_security import verify_token

app = FastAPI(title="fDA Restaurant Service", version="1.0.0")

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/")
def root():
    return {"status": "fDA Restaurant Service is running", "version": "1.0.0"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/upload")
async def upload_file(file: UploadFile = File(...), auth_data: dict = Depends(verify_token)):
    file_path = os.path.join(UPLOAD_DIR, f"{auth_data['user_id']}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # In a real app, this would be a public URL
    # For local dev, we point to our own mount
    url = f"http://localhost:8001/uploads/{os.path.basename(file_path)}"
    return {"url": url}

# WebSocket manager for restaurant status updates
class RestaurantConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = RestaurantConnectionManager()

@app.websocket("/ws/restaurants")
async def restaurant_websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Create tables
models.Base.metadata.create_all(bind=database.engine)

@app.post("/api/v1/restaurants", response_model=schemas.RestaurantOut)
def create_restaurant(restaurant: schemas.RestaurantCreate, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    res_data = restaurant.dict()

    # If not admin, force owner_id to be the current user
    if auth_data["role"] != "admin":
        res_data["owner_id"] = auth_data["user_id"]

        # Check if user already has a restaurant
        existing = db.query(models.Restaurant).filter(models.Restaurant.owner_id == res_data["owner_id"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="User already owns a restaurant")

    db_restaurant = models.Restaurant(**res_data)
    db.add(db_restaurant)
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

@app.put("/api/v1/restaurants/{id}", response_model=schemas.RestaurantOut)
def update_restaurant(id: str, rest_update: schemas.RestaurantUpdate, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    db_rest = db.query(models.Restaurant).filter(models.Restaurant.restaurant_id == id).first()
    if not db_rest:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if db_rest.owner_id != auth_data["user_id"] and auth_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    for key, value in rest_update.dict(exclude_unset=True).items():
        setattr(db_rest, key, value)

    db.commit()
    db.refresh(db_rest)

    # Broadcast update
    import asyncio
    asyncio.create_task(manager.broadcast({
        "type": "RESTAURANT_UPDATED",
        "restaurant_id": id,
        "is_open": db_rest.is_open,
        "is_online": db_rest.is_online,
        "name": db_rest.name
    }))

    return db_rest

@app.get("/api/v1/restaurants", response_model=List[schemas.RestaurantOut])
def get_restaurants(lat: Optional[float] = None, lng: Optional[float] = None, search: Optional[str] = None, online_only: bool = True, db: Session = Depends(database.get_db)):
    query = db.query(models.Restaurant)
    if online_only:
        query = query.filter(models.Restaurant.is_online == True)
    if search:
        query = query.filter(models.Restaurant.name.ilike(f"%{search}%") | models.Restaurant.cuisine_type.ilike(f"%{search}%"))
    return query.all()

@app.get("/api/v1/menu-items/search", response_model=List[schemas.MenuItemOut])
def search_menu_items(q: str, db: Session = Depends(database.get_db)):
    return db.query(models.MenuItem).filter(models.MenuItem.name.ilike(f"%{q}%") | models.MenuItem.description.ilike(f"%{q}%")).all()

@app.get("/api/v1/restaurants/mine", response_model=schemas.RestaurantOut)
def get_my_restaurant(auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.owner_id == auth_data["user_id"]).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found for this user")
    return restaurant

@app.get("/api/v1/restaurants/{id}", response_model=schemas.RestaurantOut)
def get_restaurant(id: str, db: Session = Depends(database.get_db)):
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.restaurant_id == id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return restaurant

@app.get("/api/v1/restaurants/{id}/menu", response_model=List[schemas.MenuItemOut])
def get_restaurant_menu(id: str, db: Session = Depends(database.get_db)):
    return db.query(models.MenuItem).filter(models.MenuItem.restaurant_id == id).all()

@app.post("/api/v1/restaurants/{id}/menu", response_model=schemas.MenuItemOut)
def create_menu_item(id: str, item: schemas.MenuItemCreate, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    # Verify ownership
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.restaurant_id == id, models.Restaurant.owner_id == auth_data["user_id"]).first()
    if not restaurant and auth_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="You do not own this restaurant")

    db_item = models.MenuItem(**item.dict(), restaurant_id=id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

import httpx
import os

ORDER_SERVICE_URL = os.getenv("ORDER_SERVICE_URL", "http://order-service:8000")

@app.post("/api/v1/reviews/orders/{order_id}/review", response_model=schemas.ReviewOut)
async def create_review(order_id: str, review: schemas.ReviewCreate, db: Session = Depends(database.get_db)):
    # Fetch restaurant_id from order-service
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(f"{ORDER_SERVICE_URL}/api/v1/orders/{order_id}")
            if res.status_code != 200:
                raise HTTPException(status_code=404, detail="Order not found")
            restaurant_id = res.json()["restaurant_id"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch order details: {e}")

    db_review = models.Review(**review.dict(), order_id=order_id, restaurant_id=restaurant_id)
    db.add(db_review)
    db.commit()
    db.refresh(db_review)

    # Update restaurant rating
    avg_rating = db.query(func.avg(models.Review.rating)).filter(models.Review.restaurant_id == restaurant_id).scalar()
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.restaurant_id == restaurant_id).first()
    if restaurant:
        restaurant.rating_avg = avg_rating
        db.commit()

    return db_review

@app.get("/api/v1/reviews/restaurants/{id}/reviews", response_model=List[schemas.ReviewOut])
def get_restaurant_reviews(id: str, db: Session = Depends(database.get_db)):
    return db.query(models.Review).filter(models.Review.restaurant_id == id).all()

@app.get("/api/v1/admin/restaurants", response_model=List[schemas.RestaurantOut])
def admin_get_restaurants(auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    if auth_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return db.query(models.Restaurant).all()

@app.post("/api/v1/admin/restaurants", response_model=schemas.RestaurantOut)
def admin_create_restaurant(restaurant: schemas.RestaurantCreate, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    if auth_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # Check if user already has a restaurant
    existing = db.query(models.Restaurant).filter(models.Restaurant.owner_id == restaurant.owner_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="User already owns a restaurant")

    db_restaurant = models.Restaurant(**restaurant.dict())
    db.add(db_restaurant)
    db.commit()
    db.refresh(db_restaurant)
    return db_restaurant

@app.patch("/api/v1/admin/restaurants/{id}/status", response_model=schemas.RestaurantOut)
def update_restaurant_status(id: str, status_update: dict, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    if auth_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")

    db_restaurant = db.query(models.Restaurant).filter(models.Restaurant.restaurant_id == id).first()
    if not db_restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")

    if "is_open" in status_update:
        db_restaurant.is_open = status_update["is_open"]

    db.commit()
    db.refresh(db_restaurant)

    # Broadcast status change
    import asyncio
    asyncio.create_task(manager.broadcast({
        "type": "RESTAURANT_STATUS_CHANGED",
        "restaurant_id": id,
        "is_open": db_restaurant.is_open,
        "is_online": db_restaurant.is_online
    }))

    return db_restaurant

@app.delete("/api/v1/admin/restaurants/{id}")
def delete_restaurant(id: str, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    if auth_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not enough permissions")
    db_rest = db.query(models.Restaurant).filter(models.Restaurant.restaurant_id == id).first()
    if not db_rest:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    db.delete(db_rest)
    db.commit()
    return {"status": "success"}

@app.put("/api/v1/menu-items/{id}", response_model=schemas.MenuItemOut)
def update_menu_item(id: str, item_update: schemas.MenuItemCreate, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.item_id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    # Verify ownership
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.restaurant_id == db_item.restaurant_id, models.Restaurant.owner_id == auth_data["user_id"]).first()
    if not restaurant and auth_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    for key, value in item_update.dict(exclude_unset=True).items():
        setattr(db_item, key, value)

    db.commit()
    db.refresh(db_item)
    return db_item

@app.delete("/api/v1/menu-items/{id}")
def delete_menu_item(id: str, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.item_id == id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    db.delete(db_item)
    db.commit()
    return {"status": "success"}

@app.put("/api/v1/suppliers/{id}", response_model=schemas.SupplierOut)
def update_supplier(id: str, supplier_update: schemas.SupplierCreate, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    db_supplier = db.query(models.Supplier).filter(models.Supplier.supplier_id == id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for key, value in supplier_update.dict().items():
        setattr(db_supplier, key, value)

    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@app.delete("/api/v1/suppliers/{id}")
def delete_supplier(id: str, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    db_supplier = db.query(models.Supplier).filter(models.Supplier.supplier_id == id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db.delete(db_supplier)
    db.commit()
    return {"status": "success"}

# --- INVENTORY SYSTEM ---

@app.get("/api/v1/suppliers", response_model=List[schemas.SupplierOut])
def get_suppliers(auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    return db.query(models.Supplier).all()

@app.post("/api/v1/suppliers", response_model=schemas.SupplierOut)
def create_supplier(supplier: schemas.SupplierCreate, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    db_supplier = models.Supplier(**supplier.dict())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier

@app.get("/api/v1/imports", response_model=List[schemas.StockImportOut])
def get_imports(auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    return db.query(models.StockImport).all()

@app.post("/api/v1/imports", response_model=schemas.StockImportOut)
def create_import(imp: schemas.StockImportCreate, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    # 1. Verify item exists
    item = db.query(models.MenuItem).filter(models.MenuItem.item_id == imp.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    # 2. Record import
    db_import = models.StockImport(**imp.dict())
    db.add(db_import)

    # 3. Update stock level and unit cost price (Weighted Average)
    new_total_qty = item.stock_level + imp.quantity
    if new_total_qty > 0:
        # Calculate new weighted average cost
        current_val = item.stock_level * item.cost_price
        import_val = imp.cost_at_import # Total cost of this batch
        item.cost_price = (current_val + import_val) / new_total_qty

    item.stock_level = new_total_qty

    db.commit()
    db.refresh(db_import)
    return db_import

@app.post("/api/v1/menu-items/{id}/reduce-stock")
def reduce_stock(id: str, quantity: int, db: Session = Depends(database.get_db)):
    item = db.query(models.MenuItem).filter(models.MenuItem.item_id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    item.stock_level -= quantity
    db.commit()
    return {
        "status": "success",
        "new_stock_level": item.stock_level,
        "cost_price": float(item.cost_price),
        "name": item.name
    }

@app.get("/api/v1/admin/summary")
def get_admin_summary(db: Session = Depends(database.get_db)):
    total_menu_items = db.query(models.MenuItem).count()
    active_restaurants = db.query(models.Restaurant).filter(models.Restaurant.is_open == True).count()
    total_restaurants = db.query(models.Restaurant).count()

    return {
        "total_menu_items": total_menu_items,
        "active_restaurants": active_restaurants,
        "total_restaurants": total_restaurants
    }

@app.get("/api/v1/restaurants/{id}/inventory-stats")
def get_inventory_stats(id: str, db: Session = Depends(database.get_db)):
    items = db.query(models.MenuItem).filter(models.MenuItem.restaurant_id == id).all()

    total_products = len(items)
    total_inventory_value = sum(item.stock_level * item.cost_price for item in items)
    expected_revenue = sum(item.stock_level * item.price for item in items)
    low_stock_items = [item for item in items if item.stock_level < 10 and item.stock_level > 0]
    out_of_stock_items = [item for item in items if item.stock_level == 0]

    # Calculate total quantity imported for each item
    # This helps in calculating "Sold Quantity" if needed,
    # but we already have stock_level which is updated on order.

    return {
        "total_products": total_products,
        "total_inventory_value": float(total_inventory_value),
        "expected_revenue": float(expected_revenue),
        "low_stock_count": len(low_stock_items),
        "out_of_stock_count": len(out_of_stock_items),
        "total_stock": sum(item.stock_level for item in items)
    }

# --- SUBSCRIPTIONS ---

@app.get("/api/v1/restaurants/{id}/subscriptions", response_model=List[schemas.SubscriptionOut])
def get_restaurant_subscriptions(id: str, db: Session = Depends(database.get_db)):
    return db.query(models.Subscription).filter(models.Subscription.restaurant_id == id).order_by(models.Subscription.start_date.desc()).all()

@app.get("/api/v1/restaurants/{id}/subscription/active", response_model=Optional[schemas.SubscriptionOut])
def get_active_subscription(id: str, db: Session = Depends(database.get_db)):
    return db.query(models.Subscription).filter(
        models.Subscription.restaurant_id == id,
        models.Subscription.status == 'ACTIVE',
        models.Subscription.end_date > datetime.now()
    ).first()

@app.post("/api/v1/restaurants/{id}/subscribe", response_model=schemas.SubscriptionOut)
def subscribe_restaurant(id: str, plan: dict, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    # Verify ownership
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.restaurant_id == id, models.Restaurant.owner_id == auth_data["user_id"]).first()
    if not restaurant and auth_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    plan_type = plan.get("plan_type")
    amounts = {"WEEKLY": 50, "MONTHLY": 180, "ANNUAL": 1800}
    days = {"WEEKLY": 7, "MONTHLY": 30, "ANNUAL": 365}

    if plan_type not in amounts:
        raise HTTPException(status_code=400, detail="Invalid plan type")

    # Deactivate existing subscriptions
    db.query(models.Subscription).filter(models.Subscription.restaurant_id == id).update({"status": "EXPIRED"})

    new_sub = models.Subscription(
        restaurant_id=id,
        plan_type=plan_type,
        amount=amounts[plan_type],
        end_date=datetime.now() + timedelta(days=days[plan_type]),
        status="ACTIVE"
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    return new_sub

# --- RESTAURANT RIDERS ---

@app.get("/api/v1/restaurants/{id}/riders", response_model=List[schemas.RestaurantRiderOut])
def get_restaurant_riders(id: str, db: Session = Depends(database.get_db)):
    return db.query(models.RestaurantRider).filter(models.RestaurantRider.restaurant_id == id).all()

@app.post("/api/v1/restaurants/{id}/riders", response_model=schemas.RestaurantRiderOut)
def add_restaurant_rider(id: str, rider: schemas.RestaurantRiderBase, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    # Verify ownership
    restaurant = db.query(models.Restaurant).filter(models.Restaurant.restaurant_id == id, models.Restaurant.owner_id == auth_data["user_id"]).first()
    if not restaurant and auth_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    db_rider = models.RestaurantRider(
        restaurant_id=id,
        rider_id=rider.rider_id,
        status=rider.status
    )
    db.add(db_rider)
    db.commit()
    db.refresh(db_rider)
    return db_rider

@app.patch("/api/v1/restaurants/{id}/riders/{rider_id}/status")
def update_restaurant_rider_status(id: str, rider_id: str, status_update: dict, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    db_rider = db.query(models.RestaurantRider).filter(models.RestaurantRider.restaurant_id == id, models.RestaurantRider.rider_id == rider_id).first()
    if not db_rider:
        raise HTTPException(status_code=404, detail="Rider not found for this restaurant")

    db_rider.status = status_update.get("status", db_rider.status)
    db.commit()
    return {"status": "success"}

# --- INQUIRIES ---

@app.post("/api/v1/public/inquiries", response_model=schemas.InquiryOut)
def create_inquiry(inquiry: schemas.InquiryCreate, db: Session = Depends(database.get_db)):
    db_inquiry = models.Inquiry(**inquiry.dict())
    db.add(db_inquiry)
    db.commit()
    db.refresh(db_inquiry)
    return db_inquiry

@app.get("/api/v1/admin/inquiries", response_model=List[schemas.InquiryOut])
def get_inquiries(auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    if auth_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return db.query(models.Inquiry).order_by(models.Inquiry.created_at.desc()).all()

# --- PUBLIC AGGREGATIONS ---

@app.get("/api/v1/public/featured-items", response_model=List[schemas.MenuItemOut])
def get_featured_items(db: Session = Depends(database.get_db)):
    return db.query(models.MenuItem).filter(models.MenuItem.is_featured == True, models.MenuItem.is_available == True).limit(8).all()

@app.get("/api/v1/public/categories")
def get_categories(db: Session = Depends(database.get_db)):
    cats = db.query(models.MenuItem.category).distinct().all()
    return [c[0] for c in cats if c[0]]

# --- PROMOTION ENDPOINTS ---

@app.get("/api/v1/public/promotions", response_model=List[schemas.PromotionOut])
def get_promotions(restaurant_id: Optional[str] = None, db: Session = Depends(database.get_db)):
    query = db.query(models.Promotion).filter(models.Promotion.is_active == True)
    if restaurant_id:
        query = query.filter(models.Promotion.restaurant_id == restaurant_id)
    else:
        query = query.filter(models.Promotion.restaurant_id == None)
    return query.all()

@app.post("/api/v1/promotions", response_model=schemas.PromotionOut)
def create_promotion(promo: schemas.PromotionCreate, auth_data: dict = Depends(verify_token), db: Session = Depends(database.get_db)):
    if auth_data["role"] not in ["admin", "vendor"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    db_promo = models.Promotion(**promo.dict())
    db.add(db_promo)
    db.commit()
    db.refresh(db_promo)
    return db_promo
