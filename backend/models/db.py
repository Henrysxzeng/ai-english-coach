# models/db.py | backend | v2.0 (Postgres)
import os
import models.pg as aiosqlite
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv("DATABASE_URL", "./data/coach.db")


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        try:
            # PG 9.2 (this server's version) has no "CREATE SCHEMA IF NOT EXISTS" (added in 9.3)
            await db.execute(f'CREATE SCHEMA "{aiosqlite.PG_SCHEMA}"')
        except Exception:
            pass  # schema already exists (e.g. "public", or a re-used test schema)
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
                jd_context TEXT DEFAULT '',
                problem_context TEXT DEFAULT ''
            )
        """)
        try:
            # CREATE TABLE IF NOT EXISTS above is a no-op once the table already exists in
            # production (it was first created in the Phase 1 migration) — new columns added
            # to the schema after that need an explicit ALTER TABLE migration.
            await db.execute("ALTER TABLE sessions ADD COLUMN problem_context TEXT DEFAULT ''")
        except Exception:
            pass  # column already exists
        await db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
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
                id SERIAL PRIMARY KEY,
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
                id SERIAL PRIMARY KEY,
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
                id          SERIAL PRIMARY KEY,
                session_id  TEXT NOT NULL,
                accuracy    REAL DEFAULT 0,
                fluency     REAL DEFAULT 0,
                expression  REAL DEFAULT 0,
                created_at  TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS vocabulary (
                id          SERIAL PRIMARY KEY,
                user_id     TEXT NOT NULL,
                word        TEXT NOT NULL,
                definition  TEXT DEFAULT '',
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
        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                clerk_user_id   TEXT PRIMARY KEY,
                resume_text     TEXT DEFAULT '',
                jd_text         TEXT DEFAULT '',
                track_focus     TEXT DEFAULT 'sde',
                active_resume_id INTEGER DEFAULT NULL,
                updated_at      TEXT NOT NULL
            )
        """)
        try:
            # user_profiles already existed in production before active_resume_id was added —
            # CREATE TABLE IF NOT EXISTS is a no-op there, so this needs an explicit migration.
            await db.execute("ALTER TABLE user_profiles ADD COLUMN active_resume_id INTEGER DEFAULT NULL")
        except Exception:
            pass
        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_resumes (
                id              SERIAL PRIMARY KEY,
                clerk_user_id   TEXT NOT NULL,
                label           TEXT NOT NULL,
                resume_text     TEXT NOT NULL,
                created_at      TEXT NOT NULL
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS module_progress (
                id              SERIAL PRIMARY KEY,
                clerk_user_id   TEXT NOT NULL,
                track           TEXT NOT NULL,
                module          TEXT NOT NULL,
                stage           TEXT NOT NULL,
                status          TEXT NOT NULL DEFAULT 'locked',
                completed_at    TEXT,
                UNIQUE (clerk_user_id, track, module, stage)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS study_materials (
                id              SERIAL PRIMARY KEY,
                clerk_user_id   TEXT NOT NULL,
                track           TEXT NOT NULL,
                module          TEXT NOT NULL,
                content         TEXT NOT NULL,
                created_at      TEXT NOT NULL,
                UNIQUE (clerk_user_id, track, module)
            )
        """)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS user_problems (
                id              SERIAL PRIMARY KEY,
                clerk_user_id   TEXT NOT NULL,
                track           TEXT NOT NULL,
                module          TEXT NOT NULL,
                title           TEXT NOT NULL,
                description     TEXT DEFAULT '',
                created_at      TEXT NOT NULL
            )
        """)
        await db.commit()
