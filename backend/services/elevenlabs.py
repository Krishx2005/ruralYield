from __future__ import annotations

import os
import logging
from typing import Optional

import httpx

logger = logging.getLogger("ruralyield.services.elevenlabs")

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"

# Minimal valid MP3 frame (silence) used as mock audio
_MOCK_AUDIO = (
    b"\xff\xfb\x90\x00\x00\x00\x00\x00\x00\x00\x00\x00"
    b"\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
    b"\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
)


async def text_to_speech(text: str, voice_id: Optional[str] = None) -> bytes:
    """
    Convert text to speech using ElevenLabs TTS API.
    Returns raw audio bytes (MP3).
    Falls back to mock audio if API key is missing or call fails.
    """
    voice_id = voice_id or DEFAULT_VOICE_ID

    if not ELEVENLABS_API_KEY:
        logger.warning("ELEVENLABS_API_KEY not set — returning mock audio")
        return _MOCK_AUDIO

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            logger.info("TTS generated %d bytes of audio", len(resp.content))
            return resp.content
    except Exception as exc:
        logger.error("ElevenLabs TTS failed: %s — returning mock audio", exc)
        return _MOCK_AUDIO


async def speech_to_text(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Transcribe audio using ElevenLabs Speech-to-Text API (Scribe v1).
    Returns the transcript string.
    Falls back to mock transcript if API key is missing or call fails.
    """
    if not ELEVENLABS_API_KEY:
        logger.warning("ELEVENLABS_API_KEY not set — returning mock transcript")
        return "[Mock transcript] This is a sample transcription of the audio file."

    url = "https://api.elevenlabs.io/v1/speech-to-text"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            files = {
                "file": (filename, audio_bytes, "audio/webm"),
            }
            data = {
                "model_id": "scribe_v1",
            }
            resp = await client.post(url, headers=headers, files=files, data=data)
            resp.raise_for_status()
            result = resp.json()
            transcript = result.get("text", "")
            logger.info("STT transcribed %d characters", len(transcript))
            return transcript
    except Exception as exc:
        logger.error("ElevenLabs STT failed: %s — returning mock transcript", exc)
        return "[Mock transcript] This is a sample transcription of the audio file."
