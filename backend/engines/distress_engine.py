from datetime import datetime
from typing import Tuple, Dict, Any

EMERGENCY_TRIGGERS = [
    "help me", "call the police", "i'm hurt", "im hurt", "fallen", 
    "can't breathe", "cant breathe", "chest pain", "someone is in the house",
    "intruder", "somebody is inside"
]

DISTRESSED_TRIGGERS = [
    "leave me alone", "i want to die", "go away", "stop talking", "get out", "scared of you"
]

ANXIOUS_TRIGGERS = [
    "i'm scared", "im scared", "where am i", "who are you", "i want to go home", "don't leave me", "dont leave me"
]

GRIEF_TRIGGERS = [
    "i miss", "where is my husband", "where is my wife", "where is yashwantha", "i miss yashwantha"
]

STATE_LEVELS = {
    "calm": 1,
    "anxious": 2,
    "confused": 3,
    "distressed": 4,
    "emergency": 5
}

LEVEL_TO_STATE = {v: k for k, v in STATE_LEVELS.items()}

def is_sundowning_window(current_time_str: str = None, start_str: str = "16:00", end_str: str = "19:00") -> bool:
    if current_time_str:
        try:
            time_parts = current_time_str.split(":")
            hour, minute = int(time_parts[0]), int(time_parts[1])
        except Exception:
            now = datetime.now()
            hour, minute = now.hour, now.minute
    else:
        now = datetime.now()
        hour, minute = now.hour, now.minute

    start_h, start_m = map(int, start_str.split(":"))
    end_h, end_m = map(int, end_str.split(":"))

    current_mins = hour * 60 + minute
    start_mins = start_h * 60 + start_m
    end_mins = end_h * 60 + end_m

    return start_mins <= current_mins <= end_mins

def detect_emotion(
    patient_message: str,
    override_time: str = None,
    sundowning_start: str = "16:00",
    sundowning_end: str = "19:00",
    recent_distress_count: int = 0
) -> Tuple[str, bool, str]:
    """
    Returns: (emotion_state, sundowning_mode, detail_reason)
    """
    msg_lower = patient_message.lower()
    base_state = "calm"
    reason = "Normal conversational state"

    if any(trigger in msg_lower for trigger in EMERGENCY_TRIGGERS):
        base_state = "emergency"
        reason = f"Matched emergency phrase in message: '{patient_message}'"
    elif any(trigger in msg_lower for trigger in DISTRESSED_TRIGGERS):
        base_state = "distressed"
        reason = f"Matched distress phrase in message: '{patient_message}'"
    elif any(trigger in msg_lower for trigger in ANXIOUS_TRIGGERS):
        base_state = "anxious"
        reason = f"Matched anxious phrase in message: '{patient_message}'"
    elif any(trigger in msg_lower for trigger in GRIEF_TRIGGERS):
        base_state = "anxious"
        reason = f"Matched grief phrase in message: '{patient_message}'"

    level = STATE_LEVELS[base_state]

    # Check sundowning
    sundowning_active = is_sundowning_window(override_time, sundowning_start, sundowning_end)
    if sundowning_active and level > 1:
        level = min(5, level + 1)
        reason += " [Heightened by Sundowning Window]"
    elif sundowning_active and level == 1 and ("where" in msg_lower or "scared" in msg_lower or "who" in msg_lower):
        level = 2
        reason += " [Sundowning disorientation]"

    # Escalation for recent repeated distress
    if recent_distress_count > 1 and level > 1:
        level = min(5, level + 1)
        reason += f" [Repeated distress count: {recent_distress_count}]"

    final_state = LEVEL_TO_STATE[level]
    return final_state, sundowning_active, reason
