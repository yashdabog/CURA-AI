import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models import Routine, Alert
from db import get_db, log_audit

router = APIRouter()

class RoutineAction(BaseModel):
    action: str  # "done" | "snooze" | "miss"
    speaker: str = "patient"

@router.get("/routines", response_model=List[Routine])
def list_routines():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM routines ORDER BY time ASC")
    rows = cursor.fetchall()
    conn.close()
    return [Routine(**dict(r)) for r in rows]

@router.post("/routines", response_model=Routine)
def create_routine(rt: Routine):
    conn = get_db()
    cursor = conn.cursor()
    rt_id = rt.id or f"rt_{uuid.uuid4().hex[:8]}"

    cursor.execute("""
        INSERT INTO routines (id, title, time, type, critical, snooze_minutes, snooze_limit, escalation_after_n_misses, active, missed_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    """, (
        rt_id, rt.title, rt.time, rt.type,
        1 if rt.critical else 0, rt.snooze_minutes, rt.snooze_limit,
        rt.escalation_after_n_misses, 1 if rt.active else 0
    ))

    log_audit(cursor, "routine_created", {"routine_id": rt_id, "title": rt.title, "time": rt.time})
    conn.commit()
    conn.close()
    rt.id = rt_id
    return rt

@router.post("/routines/{rt_id}/action")
def routine_action(rt_id: str, payload: RoutineAction):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("SELECT * FROM routines WHERE id = ?", (rt_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Routine not found.")

    rt = dict(row)

    if payload.action == "done":
        cursor.execute("""
            UPDATE routines SET missed_count = 0, last_acknowledged_at = ? WHERE id = ?
        """, (now, rt_id))
        log_audit(cursor, "routine_completed", {"routine_id": rt_id, "title": rt["title"], "by": payload.speaker})
        conn.commit()
        conn.close()
        return {"status": "completed", "message": f"Routine '{rt['title']}' marked completed."}

    elif payload.action == "snooze":
        log_audit(cursor, "routine_snoozed", {"routine_id": rt_id, "title": rt["title"], "minutes": rt["snooze_minutes"]})
        conn.commit()
        conn.close()
        return {"status": "snoozed", "snooze_minutes": rt["snooze_minutes"]}

    elif payload.action == "miss":
        new_missed = rt["missed_count"] + 1
        cursor.execute("UPDATE routines SET missed_count = ? WHERE id = ?", (new_missed, rt_id))
        
        alert_created = None
        if rt["critical"] and new_missed >= rt["escalation_after_n_misses"]:
            alert_id = f"alert_{uuid.uuid4().hex[:8]}"
            alert_msg = f"Critical routine '{rt['title']}' missed {new_missed} times!"
            cursor.execute("""
                INSERT INTO alerts (id, type, severity, message, created_at, acknowledged)
                VALUES (?, 'missed_routine', 'warning', ?, ?, 0)
            """, (alert_id, alert_msg, now))
            alert_created = alert_id
            log_audit(cursor, "routine_missed_escalated", {"routine_id": rt_id, "missed_count": new_missed, "alert_id": alert_id})

        conn.commit()
        conn.close()
        return {"status": "missed", "missed_count": new_missed, "alert_id": alert_created}

    conn.close()
    raise HTTPException(status_code=400, detail="Invalid routine action.")
