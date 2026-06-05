# tests/conftest.py | qa | v1.0
import asyncio
import os
import tempfile

import pytest

# Set test DB path before any app module is imported by test files.
# conftest.py is loaded by pytest before test modules, so this env var
# is visible when routers capture DB_PATH at import time.
_tmpdir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = os.path.join(_tmpdir, "test_coach.db")


@pytest.fixture(scope="session", autouse=True)
def init_test_database():
    # ASGITransport does not trigger the app lifespan, so we initialize
    # the DB tables explicitly before any test runs.
    from models.db import init_db
    asyncio.run(init_db())
