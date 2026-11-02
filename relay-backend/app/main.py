from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import SessionLocal, init_db
from .routers import audit, claims, handover, meta, projects, reconstruction, sources
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed(db)  # idempotent
    finally:
        db.close()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Relay API",
        description="Evidence-backed project handover backend",
        version="0.2.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(meta.router)
    app.include_router(projects.router)
    app.include_router(sources.router)
    app.include_router(reconstruction.router)
    app.include_router(claims.router)
    app.include_router(handover.router)
    app.include_router(audit.router)

    @app.get("/")
    def root():
        return {"service": "relay-api", "status": "ok",
                "gemini_configured": bool(settings.gemini_api_key)}

    return app


app = create_app()