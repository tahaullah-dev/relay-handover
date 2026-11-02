import os
import pathlib
import sys

TEST_DB = pathlib.Path(__file__).parent / "test_relay.db"
if TEST_DB.exists():
    try:
        TEST_DB.unlink()
    except PermissionError:
        pass

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"
os.environ["GEMINI_API_KEY"] = ""
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

sys.path.insert(0, str(pathlib.Path(__file__).parent.parent))

import pytest
from fastapi.testclient import TestClient

from app.database import init_db, SessionLocal, engine
from app.main import create_app
from app.seed import seed


@pytest.fixture(scope="session")
def client():
    init_db()
    db = SessionLocal()
    seed(db)
    db.close()
    app = create_app()
    with TestClient(app) as c:
        yield c
    
    # Clean up database
    engine.dispose()  # Close all SQLAlchemy connections to release the SQLite lock
    if TEST_DB.exists():
        try:
            TEST_DB.unlink()
        except PermissionError:
            pass  # Windows sometimes keeps SQLite files locked briefly