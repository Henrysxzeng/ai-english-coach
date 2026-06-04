# tests/conftest.py | qa | v1.0
import os
import tempfile

# Set test DB path before any app module is imported by test files.
# conftest.py is loaded by pytest before test modules, so this env var
# is visible when routers capture DB_PATH at import time.
_tmpdir = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = os.path.join(_tmpdir, "test_coach.db")
