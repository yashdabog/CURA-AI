import re
from typing import Dict, List, Tuple, Optional
from engines.memory_engine import get_memory_similarity, token_similarity

PARAPHRASE_BANKS = {
    "where_is_person": [
        "{name} is safe and sound, Varsha. He was thinking of you today.",
        "Everything is fine with {name}. He will be calling you on Sunday at 5 PM as usual.",
        "{name} loves you very much and sends his warmest love to you right now.",
        "Your family member {name} is doing wonderfully and is looking forward to speaking with you."
    ],
    "what_time_is_it": [
        "It is currently {time} in the {period}.",
        "We are enjoying a lovely {period} right now at {time}.",
        "The clock shows {time}. It's a peaceful {period} today.",
        "It is {time} now, a fine time to rest or enjoy some tea."
    ],
    "when_is_event": [
        "{event} is coming up soon! Yokeshwaran will make sure everything is ready.",
        "We have {event} on the calendar, and it will be a lovely time.",
        "That is scheduled for {time}. You don't need to worry about a thing.",
        "Everything is arranged for {event}. You are all set."
    ],
    "who_are_you": [
        "I am CURA, your friendly companion here to keep you company and help you anytime.",
        "My name is CURA. I'm right here with you to chat, share memories, and listen.",
        "I'm CURA! I am your supportive companion, always here by your side.",
        "I am CURA, Varsha. I'm here to spend time with you and share quiet moments."
    ],
    "is_person_alive": [
        "{name} lived a full and wonderful life, Varsha. He shared so many cherished memories with you.",
        "You and {name} built such a beautiful home and garden together over 50 years.",
        "Thinking of {name} brings up so much love. Tell me about the roses you planted together.",
        "Your love with {name} remains so deep. You shared fifty wonderful years together."
    ]
}

# Session memory of recent patient questions: list of (question_text, archetype, count, last_reply)
_session_questions: List[Dict] = []

def classify_archetype(question: str) -> Optional[str]:
    q = question.lower()
    if any(k in q for k in ["where is", "when is yokeshwaran", "where's yokeshwaran", "where's my family"]):
        return "where_is_person"
    elif any(k in q for k in ["what time", "what's the time", "clock", "time is it"]):
        return "what_time_is_it"
    elif any(k in q for k in ["who are you", "what is your name", "who's talking"]):
        return "who_are_you"
    elif any(k in q for k in ["is yashwantha coming", "where is yashwantha", "is he coming home", "where is my husband"]):
        return "is_person_alive"
    elif any(k in q for k in ["when are we", "when is the"]):
        return "when_is_event"
    return None

def process_repetition(patient_message: str, stage: str = "mid") -> Tuple[int, str, Optional[str]]:
    """
    Returns: (repetition_count, strategy_used, archetype)
    """
    global _session_questions
    archetype = classify_archetype(patient_message)
    
    matched_entry = None
    max_sim = 0.0

    for entry in _session_questions:
        sim = get_memory_similarity(patient_message, entry["question"])
        if sim > max_sim:
            max_sim = sim
            matched_entry = entry

    threshold = 0.85 if get_memory_similarity == token_similarity else 0.80

    if matched_entry and max_sim >= threshold:
        matched_entry["count"] += 1
        count = matched_entry["count"]
        entry_archetype = matched_entry["archetype"] or archetype
    else:
        count = 1
        entry_archetype = archetype
        _session_questions.append({
            "question": patient_message,
            "archetype": archetype,
            "count": 1,
            "last_reply": ""
        })

    # Strategy selection based on count & stage
    # early: 1-2 direct_answer, 3 direct+comfort, 4 validate, 5+ redirect
    # mid/late: 1 direct_answer, 2 direct+comfort, 3 validate, 4+ redirect
    if stage == "early":
        if count <= 2:
            strategy = "direct_answer"
        elif count == 3:
            strategy = "comforting_context"
        elif count == 4:
            strategy = "validate_emotion"
        else:
            strategy = "gentle_redirection"
    else:
        if count == 1:
            strategy = "direct_answer"
        elif count == 2:
            strategy = "comforting_context"
        elif count == 3:
            strategy = "validate_emotion"
        else:
            strategy = "gentle_redirection"

    return count, strategy, entry_archetype

def update_last_reply(patient_message: str, reply: str):
    global _session_questions
    for entry in _session_questions:
        if get_memory_similarity(patient_message, entry["question"]) >= 0.7:
            entry["last_reply"] = reply
            break

def get_template_fallback(archetype: Optional[str], count: int, name: str = "Yokeshwaran") -> str:
    if not archetype or archetype not in PARAPHRASE_BANKS:
        archetype = "where_is_person"
    bank = PARAPHRASE_BANKS[archetype]
    index = (count - 1) % len(bank)
    template = bank[index]
    return template.format(name=name, time="3:30 PM", period="afternoon", event="our routine")

def enforce_repetition_directive(strategy: str, count: int, archetype: Optional[str]) -> str:
    directive = f"REPETITION HANDLING (Turn #{count}):\n"
    if strategy == "direct_answer":
        directive += "- Strategy: Provide a warm, clear, grounded direct answer.\n"
    elif strategy == "comforting_context":
        directive += "- Strategy: Provide a direct answer followed by a comforting context or personal memory.\n"
    elif strategy == "validate_emotion":
        directive += "- Strategy: Validate the patient's underlying emotion deeply before answering (e.g. 'It sounds like you miss her. That is so natural.').\n"
    else:
        directive += "- Strategy: Validate emotion, provide reassuring comfort, and gently redirect to a pleasant memory or soothing activity (e.g. looking at photo album or having tea).\n"
    
    directive += (
        "- HARD RULE: DO NOT use phrases like 'As I said', 'I already told you', or acknowledge repeating yourself.\n"
        "- Maintain the exact same warm, soothing tone as turn #1.\n"
    )
    return directive
