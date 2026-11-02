"""Thin REST wrapper around the Gemini API. Backend-only: the key never leaves this process."""
import asyncio
import json
import re

import httpx

from ..config import Settings

GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
RETRYABLE_STATUSES = {429, 500, 502, 503, 504}


class GeminiUnavailable(Exception):
    pass


def _clean_json_text(text: str) -> str:
    """Extract and clean raw JSON from model response text, stripping markdown code fences."""
    text = (text or "").strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        return match.group(1).strip()
    return text


async def generate_json(
    prompt: str,
    settings: Settings,
    timeout: float = 90.0,
    max_retries: int = 3,
) -> dict:
    """Call Gemini requesting a JSON object. Raises GeminiUnavailable on any failure.

    Includes automatic exponential backoff for transient spikes in demand (HTTP 503)
    or rate limits (HTTP 429), and falls back across active models.
    """
    if not settings.gemini_api_key:
        raise GeminiUnavailable("GEMINI_API_KEY is not configured")

    models_to_try = []
    if settings.gemini_model:
        models_to_try.append(settings.gemini_model)
    for fallback in ["gemini-3.8-flash", "gemini-3.7-flash"]:
        if fallback not in models_to_try:
            models_to_try.append(fallback)

    errors = []
    for model in models_to_try:
        clean_model = model.replace("models/", "")
        url = GEMINI_ENDPOINT.format(model=clean_model)
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"response_mime_type": "application/json", "temperature": 0.1},
        }

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(
                        url,
                        params={"key": settings.gemini_api_key},
                        json=payload,
                    )

                if resp.status_code in RETRYABLE_STATUSES:
                    # Spikes in demand (503) or rate limits (429) are temporary
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2.0 * (attempt + 1))
                        continue
                    errors.append(f"{clean_model} (HTTP {resp.status_code} after {max_retries} attempts)")
                    break

                if resp.status_code != 200:
                    errors.append(f"{clean_model} (HTTP {resp.status_code})")
                    break

                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                cleaned = _clean_json_text(text)
                return json.loads(cleaned)

            except (httpx.TimeoutException, httpx.NetworkError) as exc:
                if attempt < max_retries - 1:
                    await asyncio.sleep(1.5 * (attempt + 1))
                    continue
                errors.append(f"{clean_model} ({type(exc).__name__})")
                break
            except json.JSONDecodeError as exc:
                errors.append(f"{clean_model} (JSON parse error: {exc})")
                break
            except Exception as exc:
                errors.append(f"{clean_model} ({exc})")
                break

    raise GeminiUnavailable(f"Gemini call failed: {'; '.join(errors)}")
