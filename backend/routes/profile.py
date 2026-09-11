from fastapi import APIRouter, HTTPException
from models import PatientProfile
from db import get_db, log_audit

router = APIRouter()

@router.get("/profile", response_model=PatientProfile)
def get_profile():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM patient_profile WHERE id = 'default_patient'")
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Patient profile not found.")
    d = dict(row)
    d["simple_mode"] = bool(d["simple_mode"])
    d["consent_recorded"] = bool(d["consent_recorded"])
    return PatientProfile(**d)

@router.put("/profile", response_model=PatientProfile)
def update_profile(updated: PatientProfile):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT stage, consent_recorded FROM patient_profile WHERE id = 'default_patient'")
    old_row = cursor.fetchone()
    old_stage = old_row["stage"] if old_row else "mid"
    old_consent = bool(old_row["consent_recorded"]) if old_row else False

    cursor.execute("""
        UPDATE patient_profile
        SET full_name = ?, preferred_name = ?, birth_year = ?, stage = ?, voice_speed = ?, voice_name = ?,
            simple_mode = ?, consent_recorded = ?, caregiver_name = ?, caregiver_relationship = ?,
            sundowning_start = ?, sundowning_end = ?, escalation_timeout_minutes = ?
        WHERE id = 'default_patient'
    """, (
        updated.full_name, updated.preferred_name, updated.birth_year, updated.stage,
        updated.voice_speed, updated.voice_name, 1 if updated.simple_mode else 0,
        1 if updated.consent_recorded else 0, updated.caregiver_name, updated.caregiver_relationship,
        updated.sundowning_start, updated.sundowning_end, updated.escalation_timeout_minutes
    ))

    # Audit stage changes
    if old_stage != updated.stage:
        log_audit(cursor, "stage_changed", {
            "from_stage": old_stage,
            "to_stage": updated.stage,
            "changed_by": updated.caregiver_name or "Caregiver"
        })

    # Audit consent changes
    if not old_consent and updated.consent_recorded:
        log_audit(cursor, "consent_recorded", {
            "patient_name": updated.full_name,
            "caregiver_name": updated.caregiver_name,
            "relationship": updated.caregiver_relationship
        })

    conn.commit()
    conn.close()
    return updated
