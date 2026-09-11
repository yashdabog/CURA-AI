import json
from fastapi import APIRouter
from db import get_db

router = APIRouter()

@router.get("/dashboard/timeline")
def get_timeline():
    conn = get_db()
    cursor = conn.cursor()

    # Get recent messages
    cursor.execute("SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50")
    messages = [dict(r) for r in cursor.fetchall()]

    # Get recent alerts
    cursor.execute("SELECT * FROM alerts ORDER BY created_at DESC LIMIT 20")
    alerts = [dict(r) for r in cursor.fetchall()]

    # Get recent routines completed/missed
    cursor.execute("SELECT * FROM routines")
    routines = [dict(r) for r in cursor.fetchall()]

    # Sundowning status
    cursor.execute("SELECT sundowning_start, sundowning_end, stage FROM patient_profile WHERE id = 'default_patient'")
    prof = dict(cursor.fetchone())

    conn.close()

    return {
        "messages": messages,
        "alerts": alerts,
        "routines": routines,
        "patient_stage": prof["stage"]
    }
