from fastapi import APIRouter

from ..config import get_settings
from ..schemas import MetaOut

router = APIRouter(tags=["meta"])


@router.get("/meta", response_model=MetaOut)
def meta() -> MetaOut:
    settings = get_settings()
    return MetaOut(mode="live", gemini_configured=bool(settings.gemini_api_key), version="0.2.0")