from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
import uuid

import httpx
import os
import models, schemas, database

app = FastAPI(title="fDA Payment Service", version="1.0.0")

@app.get("/")
def root():
    return {"status": "fDA Payment Service is running", "version": "1.0.0"}

def get_service_url(env_var, default_docker, local_port):
    if os.getenv("KUBERNETES_SERVICE_HOST") or os.getenv("DOCKER_CONTAINER"):
        return os.getenv(env_var, default_docker)
    return os.getenv(env_var, f"http://localhost:{local_port}")

ORDER_SERVICE_URL = get_service_url("ORDER_SERVICE_URL", "http://order-service:8000", 8002)

@app.post("/api/v1/payments/initiate", response_model=schemas.PaymentOut)
def initiate_payment(payment: schemas.PaymentInitiate, db: Session = Depends(database.get_db)):
    # 5. Initiate MoMo push (Mocking external API call)
    # response = mtn_api.request_payment(phone=payment.phone, amount=payment.amount)

    db_payment = models.Payment(
        order_id=payment.order_id,
        amount=payment.amount,
        provider=payment.provider,
        status=models.PaymentStatus.PENDING,
        transaction_ref=str(uuid.uuid4()) # Placeholder ref
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

@app.post("/api/v1/payments/momo/callback")
async def momo_callback(callback: schemas.PaymentCallback, db: Session = Depends(database.get_db)):
    return await process_callback(callback, db)

@app.post("/api/v1/payments/hubtel/callback")
async def hubtel_callback(callback: schemas.PaymentCallback, db: Session = Depends(database.get_db)):
    return await process_callback(callback, db)

async def process_callback(callback: schemas.PaymentCallback, db: Session = Depends(database.get_db)):
    # 7. Payment callback (success)
    payment = db.query(models.Payment).filter(models.Payment.transaction_ref == callback.transaction_ref).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if callback.status == "SUCCESS":
        payment.status = models.PaymentStatus.SUCCESS
        payment.paid_at = func.now()

        # 8. Confirm payment, update order status=PLACED
        async with httpx.AsyncClient() as client:
            try:
                await client.patch(
                    f"{ORDER_SERVICE_URL}/api/v1/orders/{payment.order_id}/status",
                    json={"status": "PLACED"}
                )
            except Exception as e:
                print(f"Failed to update order status: {e}")
    else:
        payment.status = models.PaymentStatus.FAILED

    db.commit()
    return {"status": "processed"}


@app.get("/api/v1/payments/order/{order_id}", response_model=schemas.PaymentOut)
def get_payment_by_order(order_id: UUID, db: Session = Depends(database.get_db)):
    payment = db.query(models.Payment).filter(models.Payment.order_id == order_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return payment

@app.get("/api/v1/admin/payments", response_model=list[schemas.PaymentOut])
def get_all_payments(db: Session = Depends(database.get_db)):
    return db.query(models.Payment).all()
