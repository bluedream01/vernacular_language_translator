import sys
import sounddevice as sd
from scipy.io.wavfile import write

def main():
    if len(sys.argv) < 3:
        print("Usage: python mic_record.py <output.wav> <duration_seconds>")
        sys.exit(1)

    output_path = sys.argv[1]
    duration = float(sys.argv[2])

    fs = 16000  # sample rate
    print(f"[INFO] Recording {duration} seconds from microphone...")
    recording = sd.rec(int(duration * fs), samplerate=fs, channels=1)
    sd.wait()
    write(output_path, fs, recording)
    print(f"[INFO] Saved recording to {output_path}")

if __name__ == "__main__":
    main()
