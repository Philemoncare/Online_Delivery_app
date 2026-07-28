from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os

app = FastAPI(title="fDA AI Assistant Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    user_id: str = "anonymous"

RESTAURANT_SERVICE_URL = os.getenv("RESTAURANT_SERVICE_URL", "http://localhost:8001")

@app.post("/api/v1/ai/chat")
async def ai_chat(request: ChatRequest):
    msg = request.message.lower()

    # Simple rule-based AI for simulation
    if "restaurant" in msg or "food" in msg or "eat" in msg:
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(f"{RESTAURANT_SERVICE_URL}/api/v1/restaurants")
                restaurants = res.json()
                names = [r["name"] for r in restaurants[:3]]
                return {"reply": f"Based on your preferences, I recommend: {', '.join(names)}. They are currently open and delivering!"}
        except:
            return {"reply": "I can recommend some great local spots once the restaurant service is online!"}

    if "status" in msg or "order" in msg:
        return {"reply": "I can help track your order! Please provide your order ID or check the 'Orders' tab for real-time tracking."}

    if "help" in msg or "support" in msg:
        return {"reply": "I'm here to help! You can ask me about restaurants, your order status, or how to use the fDA platform."}

    return {"reply": "I'm your fDA AI Assistant. I can help you find the best food and track your deliveries. What's on your mind?"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
