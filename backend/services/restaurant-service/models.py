from sqlalchemy import Column, String, Boolean, Numeric, ForeignKey, DateTime, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from database import Base

class Restaurant(Base):
    __tablename__ = "restaurants"

    restaurant_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), nullable=False) # References users in auth-service
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=False)
    geo_lat = Column(Numeric(9,6), nullable=False)
    geo_lng = Column(Numeric(9,6), nullable=False)
    is_open = Column(Boolean, default=True)
    is_online = Column(Boolean, default=True)
    rating_avg = Column(Numeric(2,1), default=0.0)
    cuisine_type = Column(String(100))
    image_url = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    opening_hours = Column(Text, nullable=True) # JSON string
    delivery_radius = Column(Numeric(5,2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    menu_items = relationship("MenuItem", back_populates="restaurant")
    reviews = relationship("Review", back_populates="restaurant")

class MenuItem(Base):
    __tablename__ = "menu_items"

    item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    price = Column(Numeric(10,2), nullable=False)
    cost_price = Column(Numeric(10,2), default=0.00)
    stock_level = Column(Integer, default=0)
    description = Column(Text)
    category = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    is_available = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)

    restaurant = relationship("Restaurant", back_populates="menu_items")
    imports = relationship("StockImport", back_populates="item")

class Supplier(Base):
    __tablename__ = "suppliers"
    supplier_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    contact_person = Column(String(255))
    phone = Column(String(20))
    email = Column(String(255))
    address = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class StockImport(Base):
    __tablename__ = "stock_imports"
    import_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.supplier_id"), nullable=False)
    item_id = Column(UUID(as_uuid=True), ForeignKey("menu_items.item_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    cost_at_import = Column(Numeric(10,2), nullable=False)
    import_date = Column(DateTime(timezone=True), server_default=func.now())

    item = relationship("MenuItem", back_populates="imports")
    supplier = relationship("Supplier")

class Review(Base):
    __tablename__ = "reviews"

    review_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), nullable=False)
    restaurant_id = Column(UUID(as_uuid=True), ForeignKey("restaurants.restaurant_id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    restaurant = relationship("Restaurant", back_populates="reviews")
