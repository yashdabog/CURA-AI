import uuid
import json
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter
from pydantic import BaseModel
from db import get_db, log_audit

router = APIRouter()

class FamilyMemorySubmission(BaseModel):
    submitter_name: str
    relationship: str
    type: str  # person | place | event | preference
    title: str
    content: str
    related_people: List[str] = []

STAGE_ENGAGEMENT_GUIDES = {
    "early": [
        {"title": "Reminiscence Conversation", "body": "Ask about her teaching years at Riverside School or classic literature. She enjoys sharing rich stories."},
        {"title": "Cognitive Stimulation", "body": "Play simple word or recall games together. Ask open-ended questions about past achievements."},
        {"title": "Schedule Reminder", "body": "Mention upcoming family visits or calls clearly so she can look forward to them."}
    ],
    "mid": [
        {"title": "Short & Focused Calls", "body": "Keep telephone calls to 10 minutes, focusing on one warm topic at a time. Avoid memory testing or quizzes."},
        {"title": "Embrace Repetition", "body": "Expect repetition — it is completely normal. Answer with the exact same warmth every time."},
        {"title": "Use Her Name Often", "body": "Greeting her by name frequently provides comfort and grounds the conversation."}
    ],
    "late": [
        {"title": "Sensory Presence", "body": "Your voice and gentle tone matter most. Speak softly and calmly."},
        {"title": "Music & Visuals", "body": "Play her favorite classical music or show single family photos slowly."},
        {"title": "No Corrections", "body": "Never correct confusion or argue fixed beliefs. Simply reassure her of safety and love."}
    ]
}

@router.post("/family/submit-memory")
def submit_family_memory(sub: FamilyMemorySubmission):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.now(timezone.utc).isoformat()
    mem_id = f"mem_fam_{uuid.uuid4().hex[:8]}"

    content_with_source = f"{sub.content} (Submitted by {sub.submitter_name}, {sub.relationship})"

    cursor.execute("""
        INSERT INTO memories (id, type, title, content, related_people, source, verification_state, created_at)
        VALUES (?, ?, ?, ?, ?, 'family', 'pending', ?)
    """, (
        mem_id, sub.type, sub.title, content_with_source,
        json.dumps(sub.related_people), now
    ))

    log_audit(cursor, "family_memory_submitted", {
        "memory_id": mem_id,
        "submitter": sub.submitter_name,
        "title": sub.title
    })

    conn.commit()
    conn.close()
    return {"status": "submitted", "memory_id": mem_id, "message": "Memory submitted for caregiver review."}

@router.get("/family/engagement-guide")
def get_engagement_guide():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT stage FROM patient_profile WHERE id = 'default_patient'")
    p = cursor.fetchone()
    stage = p["stage"] if p else "mid"

    cursor.execute("SELECT title, time FROM routines WHERE type = 'family_call' AND active = 1 LIMIT 1")
    f_call = cursor.fetchone()
    conn.close()

    guide_cards = STAGE_ENGAGEMENT_GUIDES.get(stage, STAGE_ENGAGEMENT_GUIDES["mid"])
    next_call = f"Scheduled call: {dict(f_call)['time']}" if f_call else "No scheduled call"

    return {
        "stage": stage,
        "guide_cards": guide_cards,
        "next_scheduled_call": next_call
    }
