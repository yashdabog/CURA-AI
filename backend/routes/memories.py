import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from models import Memory
from db import get_db, log_audit

router = APIRouter()

@router.get("/memories", response_model=List[Memory])
def list_memories(filter_type: Optional[str] = None, pending_only: bool = False):
    conn = get_db()
    cursor = conn.cursor()
    
    query = "SELECT * FROM memories WHERE 1=1"
    params = []

    if pending_only:
        query += " AND verification_state = 'pending'"
    elif filter_type and filter_type.lower() != "all":
        query += " AND type = ?"
        params.append(filter_type.lower())

    query += " ORDER BY created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d["related_people"] = json.loads(d["related_people"]) if d["related_people"] else []
        result.append(Memory(**d))
    return result

@router.post("/memories", response_model=Memory)
def create_memory(mem: Memory):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    mem_id = mem.id or f"mem_{uuid.uuid4().hex[:8]}"

    # Consent check
    cursor.execute("SELECT consent_recorded FROM patient_profile WHERE id = 'default_patient'")
    p = cursor.fetchone()
    if not p or not p["consent_recorded"]:
        conn.close()
        raise HTTPException(status_code=403, detail="Consent is required before adding personal memories.")

    verified_at = now if mem.verification_state == "verified" else None

    cursor.execute("""
        INSERT INTO memories (id, type, title, content, related_people, source, verification_state, created_at, verified_at, superseded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        mem_id, mem.type, mem.title, mem.content,
        json.dumps(mem.related_people), mem.source, mem.verification_state,
        now, verified_at, None
    ))

    log_audit(cursor, "memory_created", {
        "memory_id": mem_id,
        "title": mem.title,
        "source": mem.source,
        "verification_state": mem.verification_state
    })

    conn.commit()
    conn.close()
    mem.id = mem_id
    mem.created_at = now
    mem.verified_at = verified_at
    return mem

@router.post("/memories/{mem_id}/verify", response_model=Memory)
def verify_memory(mem_id: str):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("SELECT * FROM memories WHERE id = ?", (mem_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Memory not found.")

    cursor.execute("""
        UPDATE memories SET verification_state = 'verified', verified_at = ? WHERE id = ?
    """, (now, mem_id))

    log_audit(cursor, "memory_verified", {"memory_id": mem_id})
    conn.commit()

    cursor.execute("SELECT * FROM memories WHERE id = ?", (mem_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    updated["related_people"] = json.loads(updated["related_people"]) if updated["related_people"] else []
    return Memory(**updated)

@router.put("/memories/{mem_id}", response_model=Memory)
def edit_memory(mem_id: str, updated_mem: Memory):
    """
    Edits memory via versioning: marks old memory as superseded and creates new verified version.
    """
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()

    cursor.execute("SELECT * FROM memories WHERE id = ?", (mem_id,))
    old_row = cursor.fetchone()
    if not old_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Memory not found.")

    new_id = f"mem_{uuid.uuid4().hex[:8]}"

    # Mark old memory as superseded by new_id
    cursor.execute("""
        UPDATE memories SET verification_state = 'superseded', superseded_by = ? WHERE id = ?
    """, (new_id, mem_id))

    # Insert new version
    cursor.execute("""
        INSERT INTO memories (id, type, title, content, related_people, source, verification_state, created_at, verified_at, superseded_by)
        VALUES (?, ?, ?, ?, ?, ?, 'verified', ?, ?, None)
    """, (
        new_id, updated_mem.type, updated_mem.title, updated_mem.content,
        json.dumps(updated_mem.related_people), updated_mem.source,
        now, now
    ))

    log_audit(cursor, "memory_superseded_and_updated", {
        "old_id": mem_id,
        "new_id": new_id,
        "title": updated_mem.title
    })

    conn.commit()
    conn.close()

    updated_mem.id = new_id
    updated_mem.verification_state = "verified"
    updated_mem.created_at = now
    updated_mem.verified_at = now
    return updated_mem
