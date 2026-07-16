from celery import Celery
import os

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
celery = Celery("tasks", broker=CELERY_BROKER_URL)

@celery.task
def send_push_notification(user_id, title, body):
    # Integration with Firebase/OneSignal
    print(f"Sending Push to {user_id}: {title} - {body}")
    return True

@celery.task
def send_sms(phone, message):
    # Integration with Twilio/Hubtel SMS
    print(f"Sending SMS to {phone}: {message}")
    return True

@celery.task
def process_order_event(event_type, order_data):
    order_id = order_data.get('order_id')
    status = order_data.get('status')

    if event_type == "order.placed":
        send_push_notification.delay(order_data['vendor_id'], "New Order!", f"You have a new order #{order_id[:8]} to prepare.")
        send_push_notification.delay(order_data['customer_id'], "Order Placed", "Your order has been placed successfully.")

    elif status == "CONFIRMED":
        send_push_notification.delay(order_data['customer_id'], "Order Confirmed", "The restaurant has accepted your order.")

    elif status == "PREPARING":
        send_push_notification.delay(order_data['customer_id'], "Preparing Food", "Your meal is being cooked right now!")

    elif status == "READY_FOR_PICKUP":
        send_push_notification.delay(order_data['customer_id'], "Food Ready!", "Your order is ready for pickup by the rider.")
        # Notify nearby riders (Simulated)
        print("Broadcasting to nearby riders...")

    elif status == "PICKED_UP":
        send_push_notification.delay(order_data['customer_id'], "Rider on the way", "The rider has picked up your order and is heading your way.")

    elif status == "DELIVERED":
        send_push_notification.delay(order_data['customer_id'], "Food Delivered!", "Please enjoy your meal and rate the experience.")
        send_push_notification.delay(order_data['vendor_id'], "Order Delivered", f"Order #{order_id[:8]} has reached the customer.")
