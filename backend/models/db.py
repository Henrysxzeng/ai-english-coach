# models/db.py | backend | v1.0
import aiosqlite
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DATABASE_URL", "./data/coach.db")


async def init_db():
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                scene TEXT NOT NULL,
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                ended_at TEXT,
                difficulty TEXT DEFAULT 'medium',
                cefr_level TEXT DEFAULT NULL,
                resume_context TEXT DEFAULT '',
                jd_context TEXT DEFAULT ''
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                audio_path TEXT,
                turn_id INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                recording_duration_ms INTEGER DEFAULT 0,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS corrections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                turn_id INTEGER NOT NULL,
                original TEXT NOT NULL,
                corrected TEXT NOT NULL,
                explanation TEXT NOT NULL,
                error_type TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS session_analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL UNIQUE,
                scene TEXT NOT NULL,
                topic TEXT,
                clarity_score REAL DEFAULT 0,
                structure_score REAL DEFAULT 0,
                ambiguous_expressions TEXT DEFAULT '[]',
                weak_areas TEXT DEFAULT '[]',
                overall_score REAL DEFAULT 0,
                grammar_errors INTEGER DEFAULT 0,
                vocabulary_score REAL DEFAULT 0,
                created_at TEXT NOT NULL,
                FOREIGN KEY (session_id) REFERENCES sessions(id)
            )
        """)
        try:
            await db.execute("ALTER TABLE messages ADD COLUMN recording_duration_ms INTEGER DEFAULT 0")
            await db.commit()
        except Exception:
            pass  # 列已存在，忽略
        try:
            await db.execute("ALTER TABLE sessions ADD COLUMN difficulty TEXT DEFAULT 'medium'")
            await db.commit()
        except Exception:
            pass
        try:
            await db.execute("ALTER TABLE sessions ADD COLUMN cefr_level TEXT DEFAULT NULL")
            await db.commit()
        except Exception:
            pass
        try:
            await db.execute("ALTER TABLE sessions ADD COLUMN resume_context TEXT DEFAULT ''")
            await db.commit()
        except Exception:
            pass
        try:
            await db.execute("ALTER TABLE sessions ADD COLUMN jd_context TEXT DEFAULT ''")
            await db.commit()
        except Exception:
            pass
        await db.execute("""
            CREATE TABLE IF NOT EXISTS pronunciation_usage (
                user_id     TEXT NOT NULL,
                date        TEXT NOT NULL,
                count       INTEGER DEFAULT 0,
                PRIMARY KEY (user_id, date)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS pronunciation_scores (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id  TEXT NOT NULL,
                accuracy    REAL DEFAULT 0,
                fluency     REAL DEFAULT 0,
                expression  REAL DEFAULT 0,
                created_at  TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS pro_users (
                clerk_user_id   TEXT PRIMARY KEY,
                afdian_user_id  TEXT,
                created_at      TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS afdian_orders (
                afdian_user_id  TEXT PRIMARY KEY,
                paid_at         TEXT NOT NULL,
                linked          INTEGER DEFAULT 0
            )
        """)
        await db.commit()
