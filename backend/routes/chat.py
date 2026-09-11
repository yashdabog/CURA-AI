import llm
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from models import ChatRequest, ChatResponse
from db import get_db, log_audit
from engines.stage_engine import get_stage_config
from engines.memory_engine import build_context
from engines.repetition_engine import process_repetition, update_last_reply
from engines.distress_engine import detect_emotion
from engines.hallucination_engine import check_hallucination_branch
from engines.escalation_engine import trigger_escalation
from engines.guardrails import apply_guardrails
from llm import build_system_prompt, generate_llm_response, generate_fallback_response

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
def handle_chat(req: ChatRequest):
    conn = get_db()
    cursor = conn.cursor()

    # 1. Fetch Profile
    cursor.execute("SELECT * FROM patient_profile WHERE id = 'default_patient'")
    profile_row = cursor.fetchone()
    if not profile_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Patient profile not found.")
    
    profile = dict(profile_row)
    
    # Check Consent
    if not profile["consent_recorded"]:
        conn.close()
        raise HTTPException(
            status_code=403, 
            detail="Caregiver consent has not been recorded. Access disabled until consent onboarding is completed."
        )

    stage = profile["stage"]
    name = profile["preferred_name"]
    voice_speed = profile["voice_speed"]
    s_start = profile["sundowning_start"]
    s_end = profile["sundowning_end"]

    # 2. Check Hallucination Engine
    h_branch, h_instruction, h_canned = check_hallucination_branch(req.message)

    # 3. Detect Distress & Emotion
    emotion_state, sundowning_mode, distress_reason = detect_emotion(
        patient_message=req.message,
        override_time=req.override_time,
        sundowning_start=s_start,
        sundowning_end=s_end
    )

    # If hallucination Branch B (Fear-based), elevate emotion to distressed
    if h_branch == "BRANCH_B":
        emotion_state = "distressed"

    # 4. Repetition Engine
    rep_count, rep_strategy, archetype = process_repetition(req.message, stage)

    # 5. Grounding Memory Context
    grounding_block, selected_memories = build_context(req.message)

    # 6. Escalation Engine
    alert_obj, deescalation_script = trigger_escalation(
        emotion_state=emotion_state,
        patient_message=req.message,
        caregiver_name=profile["caregiver_name"] or "Yokeshwaran",
        secondary_contact_name="Viswesh"
    )

    # 7. LLM System Prompt Construction
    sys_prompt = build_system_prompt(
        patient_name=name,
        stage=stage,
        grounding_block=grounding_block,
        emotion_state=emotion_state,
        sundowning_mode=sundowning_mode,
        repetition_count=rep_count,
        repetition_strategy=rep_strategy,
        hallucination_instruction=h_instruction
    )

    # Try LLM or fallback
    raw_reply, used_llm = generate_llm_response(sys_prompt, req.message, stage)
    if not used_llm:
        raw_reply = generate_fallback_response(
            patient_message=req.message,
            stage=stage,
            repetition_count=rep_count,
            repetition_strategy=rep_strategy,
            archetype=archetype,
            hallucination_canned=h_canned,
            grounding_memories=selected_memories,
            deescalation_script=deescalation_script if emotion_state in ("distressed", "emergency") else None
        )

    # 8. Apply Guardrails before output
    final_reply, intercepted, intercept_reason = apply_guardrails(raw_reply, stage, name)

    # 9. Audio Speed adjustment for de-escalation
    if emotion_state in ("distressed", "emergency"):
        effective_speed = 0.8
    else:
        effective_speed = voice_speed

    # 10. Update Repetition History
    update_last_reply(req.message, final_reply)

    # 11. Database record keeping
    conv_id = req.conversation_id or f"conv_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc).isoformat()

    # Ensure conversation row exists
    cursor.execute("SELECT id FROM conversations WHERE id = ?", (conv_id,))
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO conversations (id, started_at, emotion_peak) VALUES (?, ?, ?)",
            (conv_id, now, emotion_state)
        )
    else:
        cursor.execute(
            "UPDATE conversations SET emotion_peak = ? WHERE id = ?",
            (emotion_state, conv_id)
        )

    # Insert messages
    pat_msg_id = f"msg_{uuid.uuid4().hex[:8]}"
    cura_msg_id = f"msg_{uuid.uuid4().hex[:8]}"

    cursor.execute("""
        INSERT INTO messages (id, conversation_id, speaker, text, emotion_state, repetition_count, strategy_used, timestamp)
        VALUES (?, ?, 'patient', ?, ?, ?, ?, ?)
    """, (pat_msg_id, conv_id, req.message, emotion_state, rep_count, rep_strategy, now))

    cursor.execute("""
        INSERT INTO messages (id, conversation_id, speaker, text, emotion_state, repetition_count, strategy_used, timestamp)
        VALUES (?, ?, 'cura', ?, ?, ?, ?, ?)
    """, (cura_msg_id, conv_id, final_reply, emotion_state, rep_count, rep_strategy, now))

    log_audit(cursor, "chat_turn", {
        "conversation_id": conv_id,
        "patient_message": req.message,
        "reply": final_reply,
        "emotion_state": emotion_state,
        "sundowning_mode": sundowning_mode,
        "repetition_count": rep_count,
        "strategy_used": rep_strategy,
        "hallucination_branch": h_branch,
        "guardrail_intercepted": intercepted
    })

    conn.commit()
    conn.close()

    return ChatResponse(
        reply=final_reply,
        audio_speed=effective_speed,
        emotion_state=emotion_state,
        sundowning_mode=sundowning_mode,
        repetition_count=rep_count,
        strategy_used=rep_strategy,
        hallucination_branch=h_branch,
        alert_created=alert_obj,
        guardrail_intercepted=intercepted,
        conversation_id=conv_id
    )
