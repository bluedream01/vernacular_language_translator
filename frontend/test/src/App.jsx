import { useState, useEffect } from "react";
import "./App.css";
import { assets } from "./assets/assets";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useLocalLLM, setUseLocalLLM] = useState(false);
  const [targetLang, setTargetLang] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const [speechLang] = useState("en-IN");
  const [isRecording, setIsRecording] = useState(false);
  let recognition;

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startStopRecording = () => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Voice input not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      return;
    }

    recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = speechLang;

    recognition.start();
    setIsRecording(true);

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setQuestion((prev) => prev + " " + text);
    };

    recognition.onerror = (err) => {
      setError("Voice input error: " + err.error);
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setResponse(null);

    // Clear previous audio
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      // 🔥 If audio file selected → call speech pipeline
      if (selectedFile) {
        const formData = new FormData();
        formData.append("audio_file", selectedFile);
        formData.append("target_lang", targetLang || "");

        const res = await fetch(`${API_URL}/VLT/content/v1/speech-pipeline`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Speech pipeline failed");
        }

        const audioBlob = await res.blob();
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url); // 👈 Show player instead of auto-playing
      } 
      // 🔥 Otherwise call text generation
      else {
        if (!question.trim()) {
          setError("Please enter a question or upload an audio file");
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_URL}/VLT/content/v1/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question.trim(),
            local_llm: useLocalLLM,
            target_lang: targetLang || null,
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setResponse(data);
      }

    } catch (err) {
      setError(
        err.message ||
        "Failed to process request. Please check backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuestion("");
    setResponse(null);
    setError(null);
    setSelectedFile(null);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1 className="title">Vernacular Language Translator</h1>
          <p className="subtitle">
            Ask a question or upload audio to generate translated speech
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form">

          {/* TEXT INPUT */}
          <div className="input-wrapper voice-input">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question here..."
              className="input"
              rows="4"
              disabled={loading}
            />
            <button
              type="button"
              className={`mic-button ${isRecording ? "recording" : ""}`}
              onClick={startStopRecording}
              disabled={loading}
            >
              {isRecording ? (
                <img src={assets.stop_icon} alt="" />
              ) : (
                <img src={assets.mic_icon} alt="" />
              )}
            </button>
          </div>

          {/* FILE UPLOAD */}
          <div className="file-upload">
            <label>Upload Audio File</label>
            <input
              type="file"
              accept="audio/mp3,audio/wav,audio/webm,audio/mp4"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              disabled={loading}
            />
            {selectedFile && (
              <p className="file-name">Selected: {selectedFile.name}</p>
            )}
          </div>

          {/* LANGUAGE SELECTOR */}
          <div className="language-box">
            <label>Translate To</label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              disabled={loading}
            >
              <option value="">None</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="bn">Bengali</option>
              <option value="te">Telugu</option>
              <option value="mr">Marathi</option>
            </select>
          </div>

          {/* LOCAL LLM */}
          <div className="toggle-container">
            <label>
              <input
                type="checkbox"
                checked={useLocalLLM}
                onChange={(e) => setUseLocalLLM(e.target.checked)}
                disabled={loading}
              />
              Use Local LLM
            </label>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="button-group">
            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
            >
              {loading ? "Processing..." : "Generate Content"}
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="button button-secondary"
              disabled={loading}
            >
              Clear
            </button>
          </div>
        </form>

        {error && <div className="alert alert-error">{error}</div>}

        {response && (
          <div className="response-card">
            <h3>Generated Content:</h3>
            <div>{response.data}</div>
          </div>
        )}

        {/* ✅ AUDIO PLAYER WITH CONTROLS */}
        {audioUrl && (
          <div className="response-card">
            <h3>Generated Audio:</h3>
            <audio controls src={audioUrl} />
          </div>
        )}

      </div>
    </div>
  );
}

export default App;