import json
import re
import math
from typing import List, Dict, Tuple
from db import get_db

# Try loading sentence-transformers, with fallback to token overlap
_embedder = None
try:
    from sentence_transformers import SentenceTransformer
    _embedder = SentenceTransformer("all-MiniLM-L6-v2")
except Exception:
    _embedder = None

def tokenize(text: str) -> List[str]:
    return re.findall(r'\w+', text.lower())

def token_similarity(str1: str, str2: str) -> float:
    tokens1 = set(tokenize(str1))
    tokens2 = set(tokenize(str2))
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / float(len(union))

def get_memory_similarity(query: str, memory_content: str) -> float:
    if _embedder is not None:
        try:
            embeddings = _embedder.encode([query, memory_content])
            vec1, vec2 = embeddings[0], embeddings[1]
            dot = sum(a * b for a, b in zip(vec1, vec2))
            norm1 = math.sqrt(sum(a * a for a in vec1))
            norm2 = math.sqrt(sum(b * b for b in vec2))
            if norm1 > 0 and norm2 > 0:
                return float(dot / (norm1 * norm2))
        except Exception:
            pass
    return token_similarity(query, memory_content)

def build_context(patient_message: str) -> Tuple[str, List[Dict]]:
    """
    Retrieves top 3-5 verified memories by similarity (threshold 0.35).
    Memories with source='ai_inference' are NEVER retrievable.
    If no memory matches above threshold, returns identity memories as defaults.
    """
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, type, title, content, related_people, source, verification_state
        FROM memories
        WHERE verification_state = 'verified' AND source != 'ai_inference'
    """)
    rows = cursor.fetchall()
    conn.close()

    scored_memories = []
    for row in rows:
        mem_dict = dict(row)
        combined_text = f"{mem_dict['title']} {mem_dict['content']}"
        sim = get_memory_similarity(patient_message, combined_text)
        scored_memories.append((sim, mem_dict))

    # Sort descending by similarity
    scored_memories.sort(key=lambda x: x[0], reverse=True)

    selected_memories = []
    for sim, mem in scored_memories:
        if sim >= 0.35 and len(selected_memories) < 5:
            selected_memories.append(mem)

    # Fallback to identity memories if none matched threshold
    if not selected_memories:
        for sim, mem in scored_memories:
            if mem['type'] in ('person', 'fact') and len(selected_memories) < 3:
                selected_memories.append(mem)

    # Format grounding block
    facts_lines = []
    mem_lines = []

    for mem in selected_memories:
        if mem['type'] in ('person', 'fact'):
            facts_lines.append(f"- {mem['title']}: {mem['content']}")
        else:
            mem_lines.append(f"- [{mem['type'].upper()}] {mem['title']}: {mem['content']}")

    grounding_block = "GROUNDING CONTEXT:\nVERIFIED FACTS (never contradict):\n"
    if facts_lines:
        grounding_block += "\n".join(facts_lines) + "\n"
    else:
        grounding_block += "- Varsha is a retired schoolteacher who taught 30 years at Riverside School.\n"

    grounding_block += "\nRELEVANT MEMORIES:\n"
    if mem_lines:
        grounding_block += "\n".join(mem_lines) + "\n"
    else:
        grounding_block += "- Has a garden with prize roses. Husband Yashwantha passed away in 2019. Yokeshwaran calls on Sundays.\n"

    return grounding_block, selected_memories
