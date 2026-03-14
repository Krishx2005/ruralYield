import logging

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import Response
from pydantic import BaseModel, Field

from services.elevenlabs import text_to_speech, speech_to_text

logger = logging.getLogger("ruralyield.routes.voice")

router = APIRouter(prefix="/api/voice", tags=["voice"])


class SynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice_id: str = Field(default="EXAVITQu4vr4xnSDxMaL")


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """Accept an audio file and return its transcript via ElevenLabs STT."""
    try:
        audio_bytes = await file.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file")

        filename = file.filename or "audio.webm"
        transcript = await speech_to_text(audio_bytes, filename=filename)

        return {"success": True, "transcript": transcript}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Transcription failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/synthesize")
async def synthesize_speech(request: SynthesizeRequest):
    """Accept text and return synthesized audio via ElevenLabs TTS."""
    try:
        audio_bytes = await text_to_speech(request.text, voice_id=request.voice_id)
        if not audio_bytes:
            raise HTTPException(status_code=500, detail="TTS returned empty audio")

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"},
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Speech synthesis failed")
        raise HTTPException(status_code=500, detail=str(exc))
