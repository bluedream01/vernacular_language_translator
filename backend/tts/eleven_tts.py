from elevenlabs.client import ElevenLabs
import os
import uuid
from dotenv import load_dotenv

load_dotenv()  # 🔥 loads .env file

API_KEY = os.getenv("ELEVEN_LABS_API_KEY")

if not API_KEY:
    raise ValueError("ElevenLabs API key missing")

client = ElevenLabs(api_key=API_KEY)
client = ElevenLabs(api_key=API_KEY)

OUT_DIR = "tts/output"
os.makedirs(OUT_DIR, exist_ok=True)


def speak(text: str) -> bytes | None:
    """
    Generate speech and return audio bytes (for API response)
    """

    if not text.strip():
        return None

    print("[ElevenLabs] Generating natural voice...")

    audio_stream = client.text_to_speech.convert(
        text=text,
        voice_id="EXAVITQu4vr4xnSDxMaL",
        model_id="eleven_multilingual_v2"
    )

    # Convert streaming generator to bytes
    audio_bytes = b"".join(audio_stream)

    return audio_bytes