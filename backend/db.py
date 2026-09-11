import sqlite3
import json
import uuid
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "cura.db")

def get_db():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Patient profile
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patient_profile (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        preferred_name TEXT NOT NULL,
        birth_year INTEGER NOT NULL,
        stage TEXT NOT NULL,
        voice_speed REAL NOT NULL,
        voice_name TEXT NOT NULL,
        simple_mode INTEGER NOT NULL DEFAULT 0,
        consent_recorded INTEGER NOT NULL DEFAULT 1,
        caregiver_name TEXT,
        caregiver_relationship TEXT,
        sundowning_start TEXT NOT NULL DEFAULT '16:00',
        sundowning_end TEXT NOT NULL DEFAULT '19:00',
        escalation_timeout_minutes INTEGER NOT NULL DEFAULT 5
    );
    """)

    # Memories
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        related_people TEXT NOT NULL, -- JSON array
        source TEXT NOT NULL,
        verification_state TEXT NOT NULL,
        created_at TEXT NOT NULL,
        verified_at TEXT,
        superseded_by TEXT
    );
    """)

    # Routines
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS routines (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        time TEXT NOT NULL,
        type TEXT NOT NULL,
        critical INTEGER NOT NULL DEFAULT 0,
        snooze_minutes INTEGER NOT NULL DEFAULT 15,
        snooze_limit INTEGER NOT NULL DEFAULT 2,
        escalation_after_n_misses INTEGER NOT NULL DEFAULT 2,
        active INTEGER NOT NULL DEFAULT 1,
        missed_count INTEGER NOT NULL DEFAULT 0,
        last_fired_at TEXT,
        last_acknowledged_at TEXT
    );
    """)

    # Contacts
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS contacts (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        escalation_order INTEGER NOT NULL
    );
    """)

    # Conversations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        started_at TEXT NOT NULL,
        emotion_peak TEXT NOT NULL DEFAULT 'calm',
        notes TEXT
    );
    """)

    # Messages
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        speaker TEXT NOT NULL,
        text TEXT NOT NULL,
        emotion_state TEXT NOT NULL DEFAULT 'calm',
        repetition_count INTEGER NOT NULL DEFAULT 0,
        strategy_used TEXT,
        timestamp TEXT NOT NULL
    );
    """)

    # Alerts
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL,
        acknowledged INTEGER NOT NULL DEFAULT 0,
        acknowledged_by TEXT,
        acknowledged_at TEXT,
        escalated_to TEXT
    );
    """)

    # Audit log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        payload TEXT NOT NULL, -- JSON
        timestamp TEXT NOT NULL
    );
    """)

    conn.commit()
    seed_if_empty(conn)
    conn.close()

def log_audit(conn_or_cursor, event_type: str, payload: dict):
    now = datetime.now(timezone.utc).isoformat()
    audit_id = f"audit_{uuid.uuid4().hex[:8]}"
    if hasattr(conn_or_cursor, "execute"):
        conn_or_cursor.execute(
            "INSERT INTO audit_log (id, event_type, payload, timestamp) VALUES (?, ?, ?, ?)",
            (audit_id, event_type, json.dumps(payload), now)
        )
        if hasattr(conn_or_cursor, "commit"):
            conn_or_cursor.commit()
    else:
        db = get_db()
        db.execute(
            "INSERT INTO audit_log (id, event_type, payload, timestamp) VALUES (?, ?, ?, ?)",
            (audit_id, event_type, json.dumps(payload), now)
        )
        db.commit()
        db.close()

def seed_if_empty(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM patient_profile")
    if cursor.fetchone()[0] == 0:
        now = datetime.now(timezone.utc).isoformat()
        
        # Profile
        cursor.execute("""
        INSERT INTO patient_profile (
            id, full_name, preferred_name, birth_year, stage, voice_speed, voice_name, simple_mode, consent_recorded, caregiver_name, caregiver_relationship, sundowning_start, sundowning_end, escalation_timeout_minutes
        ) VALUES ('default_patient', 'Varsha', 'Varsha', 1948, 'mid', 1.0, 'default', 0, 1, 'Yokeshwaran', 'Family Member', '16:00', '19:00', 5)
        """)

        # Contacts
        contacts_data = [
            ("contact_1", "primary_caregiver", "Yokeshwaran", "+1-555-0192", "yokeshwaran@example.com", 1),
            ("contact_2", "secondary", "Viswesh", "+1-555-0198", "viswesh@example.com", 2)
        ]
        cursor.executemany("INSERT INTO contacts VALUES (?, ?, ?, ?, ?, ?)", contacts_data)

        # Memories
        memories_data = [
            ("mem_1", "person", "Husband Yashwantha (Deceased)", "Yashwantha was Varsha's devoted husband of 50 years. He passed away peacefully in 2019. He loved gardening and planting prize roses.", json.dumps(["Yashwantha"]), "caregiver", "verified", now, now, None),
            ("mem_2", "person", "Family Member Yokeshwaran", "Yokeshwaran is Varsha's primary caregiver. Yokeshwaran calls every Sunday at 5 PM and visits frequently. Varsha loves him dearly.", json.dumps(["Yokeshwaran"]), "caregiver", "verified", now, now, None),
            ("mem_3", "fact", "Teaching Career", "Varsha worked for 30 years as a dedicated schoolteacher at Riverside School. She loved teaching English literature and reading classic novels.", json.dumps([]), "caregiver", "verified", now, now, None),
            ("mem_4", "preference", "Prize Roses & Garden", "Varsha takes immense pride in her garden, especially her red and yellow prize roses that she planted with Yashwantha.", json.dumps(["Yashwantha"]), "caregiver", "verified", now, now, None),
            ("mem_5", "routine", "Bridge Club Thursdays", "Varsha attended Thursday Bridge Club for over 20 years with her close neighborhood friends.", json.dumps([]), "caregiver", "verified", now, now, None),
            ("mem_6", "preference", "Famous Lemon Cake", "Varsha is famous in her family for baking delicious lemon drizzle cake for birthdays and celebrations.", json.dumps([]), "caregiver", "verified", now, now, None),
            ("mem_7", "place", "Family Cottage at Lake Windermere", "The family spent every summer holiday at their cozy cottage near Lake Windermere, feeding the swans and rowing boats.", json.dumps(["Yashwantha", "Yokeshwaran", "Viswesh"]), "caregiver", "verified", now, now, None)
        ]
        cursor.executemany("INSERT INTO memories VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", memories_data)

        # Routines
        routines_data = [
            ("rt_1", "Morning Medication", "09:00", "medication", 1, 15, 2, 2, 1, 0, None, None),
            ("rt_2", "Lunch Time", "12:30", "meal", 0, 15, 2, 2, 1, 0, None, None),
            ("rt_3", "Morning Water Hydration", "10:00", "hydration", 0, 15, 2, 2, 1, 0, None, None),
            ("rt_4", "Afternoon Hydration", "14:00", "hydration", 0, 15, 2, 2, 1, 0, None, None),
            ("rt_5", "Evening Hydration", "16:00", "hydration", 0, 15, 2, 2, 1, 0, None, None),
            ("rt_6", "Sunday Family Call with Yokeshwaran", "17:00", "family_call", 1, 15, 2, 2, 1, 0, None, None)
        ]
        cursor.executemany("INSERT INTO routines VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", routines_data)

        log_audit(cursor, "system_init", {"message": "Database initialized and seeded with default patient profile (Varsha)."})
        conn.commit()
