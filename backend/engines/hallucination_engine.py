from typing import Tuple, Optional, Dict

FEAR_HALLUCINATION_KEYWORDS = [
    "someone is in the house", "intruder", "somebody in the room", 
    "bugs on me", "insects", "stealing my", "someone taking my"
]

BENIGN_HALLUCINATION_KEYWORDS = [
    "is yashwantha coming home", "where is yashwantha", "yashwantha will be home", "is thomas coming home", "where is thomas",
    "it's 1974", "it is 1974", "going to school today", "my mother is waiting"
]

RISK_HALLUCINATION_KEYWORDS = [
    "medication is poison", "medicine is poison", "they are poisoning me",
    "going to work", "late for work", "must go to work"
]

def check_hallucination_branch(patient_message: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Returns: (branch_code, strategy_instruction, canned_override_reply)
    branch_code: 'BRANCH_A' | 'BRANCH_B' | 'BRANCH_C' | None
    """
    msg_lower = patient_message.lower()

    # Branch B: Fear-based
    if any(kw in msg_lower for kw in FEAR_HALLUCINATION_KEYWORDS):
        branch = "BRANCH_B"
        instruction = (
            "HALLUCINATION BRANCH B (FEAR-BASED):\n"
            "- Strategy: IMMEDIATE COMFORT + SAFETY AFFIRMATION.\n"
            "- Directive: Reassure the patient of absolute safety immediately. Confirm doors are secure and loved ones have checked in. Never confirm any threat exists."
        )
        canned_reply = "You are completely safe, Varsha. I am right here with you. The doors are locked and Yokeshwaran checked on you today."
        return branch, instruction, canned_reply

    # Branch C: Risk-related
    if any(kw in msg_lower for kw in RISK_HALLUCINATION_KEYWORDS):
        branch = "BRANCH_C"
        instruction = (
            "HALLUCINATION BRANCH C (RISK-RELATED):\n"
            "- Strategy: DO NOT DEBATE. Soothing non-confirmation + caregiver alert.\n"
            "- Directive: Speak softly without arguing or forcing compliance. Offer warmth and gentle presence."
        )
        canned_reply = "I understand you feel concerned, Varsha. Let's rest comfortably right now while I let Yokeshwaran know how you feel."
        return branch, instruction, canned_reply

    # Branch A: Benign false belief
    if any(kw in msg_lower for kw in BENIGN_HALLUCINATION_KEYWORDS):
        branch = "BRANCH_A"
        instruction = (
            "HALLUCINATION BRANCH A (BENIGN FALSE BELIEF):\n"
            "- Strategy: VALIDATE EMOTION, DO NOT CONFIRM, REDIRECT.\n"
            "- Directive: Acknowledge the deep love or feeling behind the question. Never confirm that the person is coming home today or state that they are dead. Redirect gently to a sweet verified memory (e.g. the prize roses or Lake Windermere)."
        )
        canned_reply = "You love Yashwantha so very much, Varsha. Tell me about the beautiful prize roses you two planted together in the garden."
        return branch, instruction, canned_reply

    return None, None, None
