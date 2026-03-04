import os
import sys
import argparse
import whisper

from translation.translator import translate_english
from translation.lang_selector import choose_language
from tts.eleven_tts import speak


def main():
    parser = argparse.ArgumentParser(
        description="Whisper STT → IndicTrans → ElevenLabs TTS"
    )
    parser.add_argument("audio_file", help="Path to audio file")
    args = parser.parse_args()

    if not os.path.exists(args.audio_file):
        print("[ERROR] Audio file not found")
        sys.exit(1)

    # 🔹 Language menu
    lang = choose_language()
    print(f"\n[INFO] Selected language: {lang}\n")

    print("[INFO] Loading Whisper model...")
    model = whisper.load_model("medium")

    print("[INFO] Transcribing audio...")
    result = model.transcribe(args.audio_file, fp16=False, language="en")
    english_text = result["text"].strip()

    print("\n=========== SPEECH PIPELINE OUTPUT ===========\n")

    print("RAW (Whisper STT):")
    print(english_text)

    translated = translate_english(english_text, lang)

    print("\nTRANSLATED (IndicTrans – native script):")
    print(translated)

    print("\n🔊 Generating neural voice...\n")

    # 🔥 ElevenLabs TTS
    speak(translated, lang)

    print("\n============================================")


if __name__ == "__main__":
    main()