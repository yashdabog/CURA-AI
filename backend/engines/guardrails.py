import re
from typing import Tuple
from db import log_audit, get_db

MEDICAL_ADVICE_PATTERNS = [
    r"\b(take|dose|dosage|mg|milligram|prescribe|pill|tablet|cure|diagnose|stop taking|side effect)\b",
    r"\b(take two|take one|take three)\b"
]

FORBIDDEN_PHRASES = [
    "i already told you",
    "as i said",
    "that's not real",
    "thats not real",
    "no one is there",
    "he's dead",
    "hes dead",
    "she's dead",
    "shes dead",
    "you already asked",
    "you are hallucinating",
    "you are confused",
    "i am human",
    "i am your husband",
    "i am thomas",
    "i am yashwantha",
    "i am sarah",
    "i am yokeshwaran"
]

SAFE_MEDICINE_REPLACEMENT = "I can't advise on medicines, Varsha. Let's ask Yokeshwaran about that."

def apply_guardrails(raw_text: str, stage: str = "mid", patient_name: str = "Varsha") -> Tuple[str, bool, str]:
    """
    Returns: (cleaned_text, intercepted_bool, reason)
    """
    text = raw_text.strip()
    intercepted = False
    reason = ""

    # 1. Medical Boundary Check
    for pattern in MEDICAL_ADVICE_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            text = SAFE_MEDICINE_REPLACEMENT
            intercepted = True
            reason = "Medical advice pattern detected and replaced with safe canned response."
            log_audit(None, "guardrail_medical_intercept", {"original": raw_text, "replaced": text})
            return text, intercepted, reason

    # 2. Forbidden Phrase Filter & Identity Honesty
    text_lower = text.lower()
    for forbidden in FORBIDDEN_PHRASES:
        if forbidden in text_lower:
            intercepted = True
            reason = f"Forbidden phrase '{forbidden}' intercepted."
            # Sanitize output cleanly
            if any(h in forbidden for h in ["dead", "not real", "no one"]):
                text = f"You are safe, {patient_name}. I am right here with you."
            elif any(h in forbidden for h in ["human", "husband", "thomas", "yashwantha", "sarah", "yokeshwaran"]):
                text = f"I am CURA, your friendly companion."
            else:
                text = f"I am right here with you, {patient_name}."
            log_audit(None, "guardrail_forbidden_phrase_intercept", {"original": raw_text, "forbidden": forbidden, "replaced": text})
            return text, intercepted, reason

    # 3. Sentence Length Enforcement per Stage
    max_words = 20 if stage == "early" else (10 if stage == "mid" else 6)
    sentences = re.split(r'(?<=[.!?])\s+', text)
    cleaned_sentences = []

    for sentence in sentences:
        words = sentence.split()
        if len(words) > max_words:
            intercepted = True
            reason = f"Sentence length ({len(words)} words) exceeded {stage} stage limit ({max_words} words)."
            truncated_words = words[:max_words]
            # Ensure proper punctuation end
            truncated_sentence = " ".join(truncated_words)
            if not truncated_sentence.endswith((".", "!", "?")):
                truncated_sentence += "."
            cleaned_sentences.append(truncated_sentence)
        else:
            cleaned_sentences.append(sentence)

    final_text = " ".join(cleaned_sentences)

    if intercepted:
        log_audit(None, "guardrail_sentence_truncation", {"original": raw_text, "truncated": final_text, "stage": stage})

    return final_text, intercepted, reason
