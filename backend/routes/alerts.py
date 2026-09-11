from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models import Alert
from db import get_db, log_audit

router = APIRouter()

class AckPayload(BaseModel):
    acknowledged_by: str = "Yokeshwaran (Caregiver)"

class EscalatePayload(BaseModel):
    contact_id: str

@router.get("/alerts", response_model=List[Alert])
def list_alerts(unack_only: bool = False):
    conn = get_db()
    cursor = conn.cursor()
    query = "SELECT * FROM alerts"
    if unack_only:
        query += " WHERE acknowledged = 0"
    query += " ORDER BY created_at DESC"
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    return [Alert(**dict(r)) for r in rows]

@router.post("/alerts/{alert_id}/acknowledge", response_model=Alert)
def acknowledge_alert(alert_id: str, payload: AckPayload):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found.")

    cursor.execute("""
        UPDATE alerts
        SET acknowledged = 1, acknowledged_by = ?, acknowledged_at = ?
        WHERE id = ?
    """, (payload.acknowledged_by, now, alert_id))

    log_audit(cursor, "alert_acknowledged", {
        "alert_id": alert_id,
        "acknowledged_by": payload.acknowledged_by
    })

    conn.commit()

    cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    return Alert(**updated)

@router.post("/alerts/{alert_id}/escalate", response_model=Alert)
def escalate_alert(alert_id: str, payload: EscalatePayload):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Alert not found.")

    cursor.execute("""
        UPDATE alerts SET escalated_to = ? WHERE id = ?
    """, (payload.contact_id, alert_id))

    log_audit(cursor, "alert_manually_escalated", {
        "alert_id": alert_id,
        "escalated_to": payload.contact_id
    })

    conn.commit()

    cursor.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    return Alert(**updated)
