from fastapi import APIRouter, HTTPException, status
import logging
from routes.users import router as users_router
from base_requests import GenerateContentRequest, GenerateContentResponse
from test_run import generate_summary
from translation.translator import translate_english
import whisper
from fastapi import UploadFile, File, Form
import tempfile
import os
from base_requests import SpeechPipelineResponse
from fastapi.responses import StreamingResponse
import io
from tts.eleven_tts import speak
from fastapi import Request
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
whisper_model = whisper.load_model("medium")

api_router = APIRouter(tags=["VLT API Services"])
api_router.include_router(users_router)


@api_router.post(
    "/generate",
    response_model=GenerateContentResponse,
    status_code=status.HTTP_200_OK,
)
async def generate_content(
    body: GenerateContentRequest,   # ✅ rename
    request: Request                # ✅ add this
):
    try:
        logger.info("Processing request")

        summary = body.question

        if body.target_lang:
            summary = translate_english(
                text=body.question,
                target_lang=body.target_lang
            )

        # ✅ STORE IN MONGO
        db = request.app.mongodb

        await db["text_history"].insert_one({
            "question": body.question,
            "response": summary,
            "target_lang": body.target_lang,
        })

        return GenerateContentResponse(
            status="success",
            message="Content generated successfully",
            data=summary,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@api_router.post(
    "/speech-pipeline",
    status_code=status.HTTP_200_OK,
)
async def speech_pipeline(
    audio_file: UploadFile = File(...),
    target_lang: str | None = Form(None),
    output_type: str = Form("text"),
):
    try:
        logger.info("Processing speech pipeline request")

        # 1️⃣ Save uploaded audio temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            contents = await audio_file.read()
            tmp.write(contents)
            temp_path = tmp.name

        # 2️⃣ Speech → Text (Whisper)
        result = whisper_model.transcribe(
            temp_path,
            fp16=False,
            language="en"
        )

        english_text = result["text"].strip()

        # 3️⃣ Translate (optional)
        translated_text = None
        if target_lang:
            translated_text = translate_english(
                text=english_text,
                target_lang=target_lang
            )

        # 4️⃣ Delete temp file
        os.remove(temp_path)

        # 5️⃣ Final text to use
        final_text = translated_text if translated_text else english_text

        # ✅ CASE 1: User wants TEXT → return immediately
        if output_type == "text":
            return {
                "status": "success",
                "message": "Speech processed successfully",
                "english_text": english_text,
                "translated_text": translated_text,
            }

        # ✅ CASE 2: User wants AUDIO → generate TTS
        if output_type == "audio":
            audio_bytes = speak(final_text)

            return StreamingResponse(
                io.BytesIO(audio_bytes),
                media_type="audio/mpeg"
            )

        # ⚠️ Fallback (invalid type)
        return {
            "status": "error",
            "message": "Invalid output_type. Use 'text' or 'audio'.",
        }

    except Exception as e:
        logger.error(f"Speech pipeline error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
from fastapi import Request

@api_router.get("/history")
async def get_history(request: Request):
    try:
        db = request.app.mongodb

        cursor = db["text_history"].find({}, {"_id": 0}).sort("_id", -1).limit(10)

        data = []
        async for doc in cursor:
            data.append(doc)

        return {
            "status": "success",
            "data": data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))