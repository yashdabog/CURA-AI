import uuid
import json
from typing import Tuple, Optional
from datetime import datetime, timezone
from db import get_db, log_audit

def trigger_escalation(
    emotion_state: str,
    patient_message: str,
    caregiver_name: str = "Yokeshwaran",
    secondary_contact_name: str = "Viswesh"
) -> Tuple[Optional[dict], str]:
    """
    Evaluates emotion state and creates appropriate alert and escalation status.
    Returns: (alert_dict, deescalation_script)
    """
    if emotion_state not in ("distressed", "emergency"):
        return None, ""

    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    alert_id = f"alert_{uuid.uuid4().hex[:8]}"
    severity = "critical" if emotion_state == "emergency" else "warning"
    alert_type = "emergency" if emotion_state == "emergency" else "distress"
    
    msg = f"Distress state '{emotion_state}' triggered by patient phrase: '{patient_message}'"

    # Fetch contacts
    cursor.execute("SELECT id, name, role FROM contacts ORDER BY escalation_order ASC")
    contacts = cursor.fetchall()
    
    primary_id = contacts[0]["id"] if len(contacts) > 0 else None
    secondary_id = contacts[1]["id"] if len(contacts) > 1 else None

    escalated_to = secondary_id if emotion_state == "emergency" else None

    cursor.execute("""
        INSERT INTO alerts (id, type, severity, message, created_at, acknowledged, escalated_to)
        VALUES (?, ?, ?, ?, ?, 0, ?)
    """, (alert_id, alert_type, severity, msg, now, escalated_to))

    alert_dict = {
        "id": alert_id,
        "type": alert_type,
        "severity": severity,
        "message": msg,
        "created_at": now,
        "acknowledged": False,
        "escalated_to": escalated_to
    }

    # Audit log
    log_audit(cursor, "alert_created", {
        "alert_id": alert_id,
        "emotion_state": emotion_state,
        "severity": severity,
        "message": msg,
        "escalated_to": escalated_to
    })

    conn.commit()
    conn.close()

    if emotion_state == "emergency":
        deescalation_script = f"I've alerted {caregiver_name}. Help is coming. You are not alone, Varsha."
    else:
        deescalation_script = f"You're safe, Varsha. I'm right here with you. Everything is okay."

    return alert_dict, deescalation_script

def check_unacknowledged_timeouts(timeout_minutes: int = 5):
    """
    Scans for unacknowledged alerts older than timeout_minutes and escalates to secondary contact.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM alerts WHERE acknowledged = 0 AND escalated_to IS NULL")
    alerts = cursor.fetchall()

    now = datetime.now(timezone.utc)
    
    # Get secondary contact
    cursor.execute("SELECT id, name FROM contacts WHERE role = 'secondary' LIMIT 1")
    sec = cursor.fetchone()
    sec_id = sec["id"] if sec else "secondary_contact"

    escalated_count = 0
    for alert in alerts:
        created_at = datetime.fromisoformat(alert["created_at"])
        diff_mins = (now - created_at).total_seconds() / 60.0
        if diff_mins >= timeout_minutes:
            cursor.execute("UPDATE alerts SET escalated_to = ? WHERE id = ?", (sec_id, alert["id"]))
            log_audit(cursor, "alert_escalated_timeout", {
                "alert_id": alert["id"],
                "reason": f"Unacknowledged after {timeout_minutes} minutes",
                "escalated_to": sec_id
            })
            escalated_count += 1

    conn.commit()
    conn.close()
    return escalated_count
