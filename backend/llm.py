import os
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY not found. Check your .env file.")
        _client = genai.Client(api_key=api_key)
    return _client

def generate(system_prompt: str, user_text: str, size: str = "mid") -> str:
    caps = {"high": 180, "mid": 100, "low": 70}
    client = get_client()
    response = client.models.generate_content(
       model="gemini-3.6-flash",
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.6,
            max_output_tokens=caps.get(size, 100),
        ),
        contents=user_text,
    )
    if not response.text:
        raise RuntimeError("Gemini returned empty response")
    return response.text.strip()
def build_system_prompt(
    patient_name: str = "Varsha",
    stage: str = "mid",
    grounding_block: str = None,
    emotion_state: str = "calm",
    sundowning_mode: bool = False,
    repetition_count: int = 1,
    repetition_strategy: str = None,
    hallucination_instruction: str = None,
) -> str:
    # Sentence length rules per dementia stage
    if stage == "early":
        max_words = 20
    elif stage == "mid":
        max_words = 10
    else:
        max_words = 6

    parts = [
        f"You are CURA, a warm, patient voice companion for {patient_name}, who has dementia.",
        f"CRITICAL STYLE RULE: Use very short, simple, warm sentences of {max_words} words or fewer.",
        "Never give medical advice — suggest asking the caregiver instead.",
        'Never say "I already told you", "as I said", or "you are confused".',
        "Never confirm or deny hallucinations harshly. Comfort first, always.",
    ]

    if grounding_block:
        parts.append(f"VERIFIED MEMORIES (use these to ground your reply):\n{grounding_block}")

    if emotion_state in ("distressed", "emergency"):
        parts.append(
            "The patient is frightened RIGHT NOW. Your reply must be immediate, gentle "
            "reassurance of safety. Short calming sentences only."
        )
    elif emotion_state == "anxious":
        parts.append(
            "The patient feels anxious. Acknowledge the feeling warmly before answering."
        )

    if sundowning_mode:
        parts.append(
            "Sundowning window is active: extra confusion is expected. "
            "Be extra gentle, simple, and reassuring."
        )

    if repetition_count and repetition_count > 1 and repetition_strategy:
        parts.append(
            f"The patient has asked this {repetition_count} times. Strategy: {repetition_strategy}. "
            "Rephrase warmly — never point out the repetition."
        )

    if hallucination_instruction:
        parts.append(hallucination_instruction)

    parts.append(
        f"Reply as CURA directly to {patient_name}, in first person, warmly."
    )
    return "\n\n".join(parts)


def generate_llm_response(system_prompt, message, stage=None):
    """Returns (reply, used_llm). Never raises — fails soft."""
    try:
        reply = generate(system_prompt, message, size="mid")
        print(f"[GEMINI OK] {reply[:80]}")
        return reply, True
    except Exception as e:
        print(f"[GEMINI ERROR] {e}")
        return None, False


from engines.repetition_engine import get_template_fallback

def generate_fallback_response(
    patient_message: str,
    stage: str = "mid",
    repetition_count: int = 1,
    repetition_strategy: str = None,
    archetype: Optional[str] = None,
    hallucination_canned: Optional[str] = None,
    grounding_memories: list = None,
    deescalation_script: Optional[str] = None,
    *args, **kwargs
) -> str:
    if hallucination_canned:
        return hallucination_canned

    if deescalation_script:
        return deescalation_script

    if repetition_count > 1 or archetype:
        return get_template_fallback(archetype, repetition_count, "Yokeshwaran")

    msg_lower = patient_message.lower()
    if "family" in msg_lower or "yokeshwaran" in msg_lower:
        return "Yokeshwaran is your primary caregiver, Varsha. He calls every Sunday at 5 PM."
    elif "teach" in msg_lower or "school" in msg_lower or "work" in msg_lower:
        return "You taught for 30 years at Riverside School, Varsha! You loved English literature."
    elif "rose" in msg_lower or "garden" in msg_lower:
        return "Your prize rose garden is lovely, Varsha. You planted those red roses with Yashwantha."
    elif "cake" in msg_lower or "bake" in msg_lower:
        return "Everyone adores your famous lemon drizzle cake, Varsha!"
    elif "cottage" in msg_lower or "lake" in msg_lower or "windermere" in msg_lower:
        return "Lake Windermere cottage is a wonderful memory with swans and boat rides."

    if stage == "early":
        return "I am right here with you, Varsha. Tell me what is on your mind today."
    elif stage == "mid":
        return "I am right here with you, Varsha. You are safe."
    else:
        return "You are safe, Varsha."