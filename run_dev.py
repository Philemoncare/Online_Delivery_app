import subprocess
import threading
import os
import sys
import time
import socket

# Configuration of services
SERVICES = [
    {"name": "Auth ", "port": 8000, "path": "backend/services/auth-service", "cmd": f"{sys.executable} -m uvicorn main:app --host 127.0.0.1 --port 8000"},
    {"name": "Rest ", "port": 8001, "path": "backend/services/restaurant-service", "cmd": f"{sys.executable} -m uvicorn main:app --host 127.0.0.1 --port 8001"},
    {"name": "Order", "port": 8002, "path": "backend/services/order-service", "cmd": f"{sys.executable} -m uvicorn main:app --host 127.0.0.1 --port 8002"},
    {"name": "Delv ", "port": 8003, "path": "backend/services/delivery-service", "cmd": f"{sys.executable} -m uvicorn main:app --host 127.0.0.1 --port 8003"},
    {"name": "Pay  ", "port": 8004, "path": "backend/services/payment-service", "cmd": f"{sys.executable} -m uvicorn main:app --host 127.0.0.1 --port 8004"},
    {"name": "Vend ", "port": 5173, "path": "frontend/vendor-web", "cmd": "npm.cmd run dev -- --port 5173 --host 127.0.0.1"},
    {"name": "Admin", "port": 5174, "path": "frontend/admin-web", "cmd": "npm.cmd run dev -- --port 5174 --host 127.0.0.1"},
]

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0

def kill_port(port):
    if os.name == 'nt':
        try:
            output = subprocess.check_output(f"netstat -aon | findstr :{port}", shell=True).decode()
            for line in output.strip().split('\n'):
                parts = line.split()
                if len(parts) > 4 and parts[1].endswith(f":{port}"):
                    pid = parts[4]
                    print(f"Cleaning up port {port} (PID {pid})...")
                    subprocess.run(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except:
            pass

def log_output(pipe, prefix):
    try:
        for line in iter(pipe.readline, ''):
            if line:
                print(f"[\033[1;34m{prefix}\033[0m] {line.strip()}")
    except:
        pass

def run_service(service):
    print(f"Launching {service['name']} on http://127.0.0.1:{service['port']}...")
    proc = subprocess.Popen(
        service['cmd'],
        cwd=service['path'],
        shell=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
        universal_newlines=True
    )
    threading.Thread(target=log_output, args=(proc.stdout, service['name']), daemon=True).start()
    threading.Thread(target=log_output, args=(proc.stderr, service['name']), daemon=True).start()
    return proc

if __name__ == "__main__":
    print("\033[1;32m=== fDA SYSTEM ORCHESTRATOR v5 ===\033[0m")

    # Pre-flight cleanup
    for s in SERVICES:
        kill_port(s['port'])

    processes = []
    try:
        for s in SERVICES:
            processes.append(run_service(s))
            time.sleep(1)

        print("\n\033[1;32mSUCCESS: All systems active.\033[0m")
        print("Vendor Portal: http://127.0.0.1:5173")
        print("Admin Portal : http://127.0.0.1:5174")
        print("\033[1;33mKEEP THIS WINDOW OPEN\033[0m\n")

        while True:
            time.sleep(5)
            for i, p in enumerate(processes):
                if p.poll() is not None:
                    print(f"\033[1;31m[CRASH]\033[0m {SERVICES[i]['name']} has stopped. Restarting...")
                    kill_port(SERVICES[i]['port'])
                    processes[i] = run_service(SERVICES[i])

    except KeyboardInterrupt:
        print("\n\033[1;31mShutting down all services...\033[0m")
        for p in processes:
            if os.name == 'nt':
                subprocess.run(f"taskkill /F /T /PID {p.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                p.terminate()
        print("System offline.")
        sys.exit(0)
