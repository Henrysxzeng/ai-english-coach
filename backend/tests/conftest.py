# tests/conftest.py | qa | v2.0 (Postgres)
import asyncio
import os
import uuid

import pytest
from dotenv import load_dotenv

# Loads the real DATABASE_URL (Aliyun Postgres) from backend/.env.
# conftest.py is loaded by pytest before test modules, so PG_SCHEMA is
# visible when routers/models.pg capture it at import time. Tests run
# inside their own throwaway Postgres schema instead of a temp SQLite
# file, so they never touch real app data.
load_dotenv()
os.environ.setdefault("PG_SCHEMA", f"pytest_{uuid.uuid4().hex[:8]}")


@pytest.fixture(scope="session", autouse=True)
def init_test_database():
    from models.db import init_db
    asyncio.run(init_db())
    yield
    _drop_test_schema()


def _drop_test_schema():
    import asyncpg

    async def _drop():
        conn = await asyncpg.connect(os.environ["DATABASE_URL"])
        try:
            await conn.execute(f'DROP SCHEMA IF EXISTS "{os.environ["PG_SCHEMA"]}" CASCADE')
        finally:
            await conn.close()

    asyncio.run(_drop())
