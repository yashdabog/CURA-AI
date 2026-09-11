from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

class PatientProfile(BaseModel):
    id: str = "default_patient"
    full_name: str = "Varsha"
    preferred_name: str = "Varsha"
    birth_year: int = 1948
    stage: str = "mid"  # early | mid | late
    voice_speed: float = 1.0  # 0.8 | 1.0 | 1.2
    voice_name: str = "default"
    simple_mode: bool = False
    consent_recorded: bool = True
    caregiver_name: Optional[str] = "Yokeshwaran"
    caregiver_relationship: Optional[str] = "Family Member"
    sundowning_start: str = "16:00"
    sundowning_end: str = "19:00"
    escalation_timeout_minutes: int = 5

class Memory(BaseModel):
    id: Optional[str] = None
    type: str  # person | place | event | preference | routine | fact
    title: str
    content: str
    related_people: List[str] = []
    source: str  # family | patient | caregiver | ai_inference
    verification_state: str = "pending"  # verified | pending | superseded
    created_at: Optional[str] = None
    verified_at: Optional[str] = None
    superseded_by: Optional[str] = None

class Routine(BaseModel):
    id: Optional[str] = None
    title: str
    time: str  # HH:MM
    type: str  # medication | meal | hydration | appointment | family_call
    critical: bool = False
    snooze_minutes: int = 15
    snooze_limit: int = 2
    escalation_after_n_misses: int = 2
    active: bool = True
    missed_count: int = 0
    last_fired_at: Optional[str] = None
    last_acknowledged_at: Optional[str] = None

class Contact(BaseModel):
    id: Optional[str] = None
    role: str  # primary_caregiver | secondary | family
    name: str
    phone: str
    email: str
    escalation_order: int = 1

class Conversation(BaseModel):
    id: Optional[str] = None
    started_at: Optional[str] = None
    emotion_peak: str = "calm"
    notes: Optional[str] = None

class Message(BaseModel):
    id: Optional[str] = None
    conversation_id: str
    speaker: str  # patient | cura
    text: str
    emotion_state: str = "calm"
    repetition_count: int = 0
    strategy_used: Optional[str] = None
    timestamp: Optional[str] = None

class Alert(BaseModel):
    id: Optional[str] = None
    type: str  # missed_routine | distress | emergency | pattern
    severity: str  # info | warning | critical
    message: str
    created_at: Optional[str] = None
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[str] = None
    escalated_to: Optional[str] = None

class AuditLog(BaseModel):
    id: Optional[str] = None
    event_type: str
    payload: dict = {}
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    speaker: str = "patient"
    override_time: Optional[str] = None  # e.g., "17:30" for sundowning/testing
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    audio_speed: float
    emotion_state: str
    sundowning_mode: bool
    repetition_count: int
    strategy_used: str
    hallucination_branch: Optional[str] = None
    alert_created: Optional[Alert] = None
    guardrail_intercepted: bool = False
    conversation_id: str
