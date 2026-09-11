STAGE_CONFIG = {
    "early": {
        "max_sentence_words": 20,
        "tone": "warm, engaged, curious",
        "behaviors": [
            "ask follow-up questions about past experiences and memories",
            "reinforce daily routines gently",
            "provide cognitively stimulating topics such as recall games and story continuation"
        ],
        "prompt_instruction": "Speak in warm, clear sentences (maximum 20 words per sentence). Ask engaging questions about past memories and encourage active recall."
    },
    "mid": {
        "max_sentence_words": 10,
        "tone": "warm, simple, patient",
        "behaviors": [
            "one idea per response",
            "repetition tolerance high",
            "gentle redirection away from distressing loops",
            "frequent use of patient's preferred name"
        ],
        "prompt_instruction": "Speak in short, very simple sentences (maximum 10 words per sentence). Present only ONE idea per response. Use the patient's name frequently. Always remain extremely patient."
    },
    "late": {
        "max_sentence_words": 6,
        "tone": "soft, soothing, present-moment",
        "behaviors": [
            "sensory comfort language",
            "use patient name in nearly every response",
            "no multi-part questions",
            "distress de-escalation prioritized over information",
            "frequent reassurance of safety and presence"
        ],
        "prompt_instruction": "Speak in ultra-short, soothing sentences (maximum 6 words per sentence). Use the patient's name in nearly every sentence. Focus entirely on safety, comfort, and reassurance."
    }
}

def get_stage_config(stage: str):
    stage_key = stage.lower() if stage else "mid"
    return STAGE_CONFIG.get(stage_key, STAGE_CONFIG["mid"])

def build_stage_prompt_directive(stage: str, name: str) -> str:
    config = get_stage_config(stage)
    max_words = config["max_sentence_words"]
    tone = config["tone"]
    instruction = config["prompt_instruction"]
    return (
        f"STAGE CONSTRAINTS ({stage.upper()} STAGE):\n"
        f"- Target Patient Name: {name}\n"
        f"- Tone: {tone}\n"
        f"- Maximum Words Per Sentence: {max_words}\n"
        f"- Instruction: {instruction}\n"
    )
