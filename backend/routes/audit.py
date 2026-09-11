import json
from typing import List, Optional
from fastapi import APIRouter
from db import get_db

router = APIRouter()

@router.get("/audit-log")
def get_audit_log(event_type: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM audit_log"
    params = []
    if event_type:
        query += " WHERE event_type = ?"
        params.append(event_type)

    query += " ORDER BY timestamp DESC LIMIT 100"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d["payload"] = json.loads(d["payload"]) if d["payload"] else {}
        result.append(d)
    return result
