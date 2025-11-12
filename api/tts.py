import os, io
import boto3
from fastapi.responses import StreamingResponse
from api.speech import tts_prepare  # už jsme přidali dřív (normalizace CZ textu)

VOICE_ID = os.getenv("TTS_VOICE_ID", "Vit")   # doporučený CZ mužský hlas
LANG     = os.getenv("TTS_LANG", "cs-CZ")

def polly_client():
    return boto3.client("polly", region_name=os.getenv("AWS_REGION", "eu-central-1"))

def synthesize(text: str) -> StreamingResponse:
    t = tts_prepare(text)
    resp = polly_client().synthesize_speech(
        Text=t, TextType="text",
        VoiceId=VOICE_ID, OutputFormat="mp3",
        LanguageCode=LANG
    )
    audio = resp["AudioStream"].read()
    return StreamingResponse(io.BytesIO(audio), media_type="audio/mpeg")
