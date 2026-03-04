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
    responses={
        400: {"description": "Invalid Question"},
        422: {"description": "Unprocessable Question"},
    },
)
async def generate_content(request: GenerateContentRequest) -> GenerateContentResponse:
    try:
        logger.info("Processing request")

        print(request.question)
        if request.target_lang:
            summary = translate_english(
                text=request.question,
                target_lang=request.target_lang
            )
            print(summary)

        return GenerateContentResponse(
            status="success",
            message="Content generated successfully",
            data=summary,
        )

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    except Exception as e:
        logger.error(f"Error generating content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating content: {str(e)}",
        )
@api_router.post(
    "/speech-pipeline",
    status_code=status.HTTP_200_OK,
)
async def speech_pipeline(
    audio_file: UploadFile = File(...),
    target_lang: str | None = Form(None),
):
    try:
        logger.info("Processing speech pipeline request")

      
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            contents = await audio_file.read()
            tmp.write(contents)
            temp_path = tmp.name

    
        result = whisper_model.transcribe(
            temp_path,
            fp16=False,
            language="en"
        )

        english_text = result["text"].strip()


        translated_text = None
        if target_lang:
            translated_text = translate_english(
                text=english_text,
                target_lang=target_lang
            )


        os.remove(temp_path)


        text_for_tts = translated_text if translated_text else english_text

        audio_bytes = speak(text_for_tts)

        return StreamingResponse(
        io.BytesIO(audio_bytes),
        media_type="audio/mpeg"
    )

    except Exception as e:
        logger.error(f"Speech pipeline error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )