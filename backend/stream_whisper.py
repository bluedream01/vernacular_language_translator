import whisper
import sounddevice as sd
import tempfile
import scipy.io.wavfile as wav

from translation.translator import translate_english
#from translation.romanizer import romanize_text
from translation.lang_selector import choose_language
from tts.eleven_tts import speak


SAMPLE_RATE = 16000
CHUNK_SECONDS = 4


def record_chunk():
    audio = sd.rec(
        int(CHUNK_SECONDS * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=1,
        dtype="float32"
    )
    sd.wait()
    return audio


sentence_buffer = ""


def is_sentence_complete(text: str) -> bool:
    return text.endswith((".", "?", "!"))


def handle_text(text: str, lang: str):
    global sentence_buffer

    sentence_buffer += " " + text

    if is_sentence_complete(sentence_buffer):
        final_text = sentence_buffer.strip()

        translated = translate_english(final_text, lang)
        #romanized = romanize_text(translated, lang)

        print("\n=========== LIVE OUTPUT ===========\n")

        print("RAW (English):")
        print(final_text)

        print("\nTRANSLATED (Native Script):")
        print(translated)

        # print("\nROMANIZED (For TTS):")
        # print(romanized)

        # speak(romanized)

        print("\n===============================\n")

        sentence_buffer = ""


def main():
    # 🔹 Language menu
    lang = choose_language()
    print(f"\n[INFO] Selected language: {lang}")

    print("[INFO] Loading Whisper model...")
    model = whisper.load_model("medium")

    print("\n🎙️ Speak now (Ctrl+C to stop)...\n")

    try:
        while True:
            audio = record_chunk()

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                wav.write(f.name, SAMPLE_RATE, audio)
                result = model.transcribe(
                    f.name,
                    fp16=False,
                    language="en"
                )

            text = result["text"].strip()
            if not text:
                continue

            handle_text(text, lang)

    except KeyboardInterrupt:
        print("\n[INFO] Stopped by user.")


if __name__ == "__main__":
    main()