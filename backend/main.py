import threading
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import init_db
from engines.escalation_engine import check_unacknowledged_timeouts
from routes import (
    chat, memories, routines, alerts, profile, family, dashboard, audit
)

app = FastAPI(
    title="CURA - Voice-First Dementia Companion API",
    description="Stage-Adaptive, Non-Medical AI Companion for Dementia Patients",
    version="1.0.0"
)

# CORS middleware for React Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(chat.router, prefix="/api", tags=["Chat"])
app.include_router(memories.router, prefix="/api", tags=["Memories"])
app.include_router(routines.router, prefix="/api", tags=["Routines"])
app.include_router(alerts.router, prefix="/api", tags=["Alerts"])
app.include_router(profile.router, prefix="/api", tags=["Profile"])
app.include_router(family.router, prefix="/api", tags=["Family"])
app.include_router(dashboard.router, prefix="/api", tags=["Dashboard"])
app.include_router(audit.router, prefix="/api", tags=["Audit"])

@app.on_event("startup")
def startup_event():
    init_db()
    # Start background thread for timeout checks
    threading.Thread(target=_background_timeout_checker, daemon=True).start()

def _background_timeout_checker():
    while True:
        try:
            check_unacknowledged_timeouts(timeout_minutes=5)
        except Exception:
            pass
        time.sleep(30)  # Check every 30 seconds

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "CURA AI Companion Backend",
        "disclaimer": "CURA is a support companion, not a medical device. Does not diagnose or prescribe."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
