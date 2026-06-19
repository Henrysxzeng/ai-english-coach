# models/pg.py | backend | v1.0
# asyncpg-backed drop-in shim for the aiosqlite usage pattern used throughout
# this codebase (`async with aiosqlite.connect(DB_PATH) as db: ...`,
# `db.row_factory = aiosqlite.Row`, `cursor.fetchone()/fetchall()`).
# Every call site does `import models.pg as aiosqlite`, so no other code
# needed to change beyond the import line + a couple of SQLite-only
# statements (INSERT OR REPLACE, datetime('now')) that have no Postgres
# equivalent and were rewritten by hand.
import os
import re
import asyncpg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
# Lets the test suite point every connection at an isolated schema inside
# the same database, instead of needing CREATE DATABASE privileges.
PG_SCHEMA = os.getenv("PG_SCHEMA", "public")

# asyncpg.Record already supports both `row["col"]` and `row[0]` access,
# which is exactly what `aiosqlite.Row` rows were used for in this codebase.
Row = asyncpg.Record

_PARAM_RE = re.compile(r"\?")


def _to_pg(query: str) -> str:
    """Translate SQLite-style `?` positional placeholders to Postgres `$1, $2, ...`."""
    counter = [0]

    def _repl(_match):
        counter[0] += 1
        return f"${counter[0]}"

    return _PARAM_RE.sub(_repl, query)


class _Cursor:
    def __init__(self, rows):
        self._rows = rows
        self._idx = 0

    async def fetchone(self):
        if self._idx >= len(self._rows):
            return None
        row = self._rows[self._idx]
        self._idx += 1
        return row

    async def fetchall(self):
        return list(self._rows)


class _Connection:
    def __init__(self, conn):
        self._conn = conn
        self.row_factory = None  # accepted for compatibility, never read

    async def execute(self, query, params=()):
        pg_query = _to_pg(query)
        stripped = pg_query.strip().upper()
        if stripped.startswith("SELECT") or stripped.startswith("WITH"):
            rows = await self._conn.fetch(pg_query, *params)
        else:
            await self._conn.execute(pg_query, *params)
            rows = []
        return _Cursor(rows)

    async def commit(self):
        pass  # asyncpg auto-commits each statement outside an explicit transaction()


class connect:
    """`async with connect(DB_PATH) as db:` — drop-in replacement for aiosqlite.connect().

    DB_PATH is accepted but ignored; the real DSN comes from DATABASE_URL so
    every existing call site (which passes its own locally-read DB_PATH) keeps
    working unchanged.
    """

    def __init__(self, _db_path_ignored=None):
        pass

    async def __aenter__(self):
        self._raw = await asyncpg.connect(DATABASE_URL, server_settings={"search_path": PG_SCHEMA})
        return _Connection(self._raw)

    async def __aexit__(self, exc_type, exc, tb):
        await self._raw.close()
