# fDA Master Startup Script (Production Logic)
Write-Host "--- fDA SYSTEM INITIALIZATION ---" -ForegroundColor Cyan

# 1. Dependency Check (Backends)
Write-Host "Verifying Python dependencies..." -ForegroundColor Yellow
pip install -r backend/services/auth-service/requirements.txt -q
pip install -r backend/services/restaurant-service/requirements.txt -q
pip install -r backend/services/order-service/requirements.txt -q
pip install -r backend/services/delivery-service/requirements.txt -q
pip install -r backend/services/payment-service/requirements.txt -q

# 2. Dependency Check (Frontends)
if (!(Test-Path "frontend/admin-web/node_modules")) {
    Write-Host "Installing Admin dependencies (one-time setup)..." -ForegroundColor Yellow
    cd frontend/admin-web; npm install; cd ../..
}

if (!(Test-Path "frontend/vendor-web/node_modules")) {
    Write-Host "Installing Vendor dependencies (one-time setup)..." -ForegroundColor Yellow
    cd frontend/vendor-web; npm install; cd ../..
}

# 3. Database Reset
Write-Host "Synchronizing master database..." -ForegroundColor Yellow
python seed_db.py

# 4. Start Unified Orchestrator
Write-Host "Launching System Orchestrator..." -ForegroundColor Green
python run_dev.py
