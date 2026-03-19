import { useState, useRef, useEffect } from "react";
import "./App.css";
import Header from "./components/Header";
import { assets } from "./assets/assets";

// Get API URL from environment variables or use default
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

function App() {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState([]);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useLocalLLM, setUseLocalLLM] = useState(false);
  const [speechLang, setSpeechLang] = useState("en-IN");
  const [translateLang, setTranslateLang] = useState("hi-IN");

  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState(null);

  const [outputType, setOutputType] = useState("text");

  const recognitionRef = useRef(null);

  /* ---------------- Speech To Text ---------------- */
  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/VLT/content/v1/history`);
      const json = await res.json();

      // Ensure we get an array
      const historyArray = Array.isArray(json.data) ? json.data : [];
      setHistory(historyArray);
    } catch (err) {
      console.error(err);
      setHistory([]); // fallback
    }
  };
  useEffect(() => {
    fetchHistory();
  }, []);

  const startStopRecording = () => {
    if (!("webkitSpeechRecognition" in window)) {
      setError("Voice input not supported in this browser.");
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = speechLang;

    recognitionRef.current = recognition;
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

  /* ---------------- Audio Upload ---------------- */

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      setQuestion(""); // Clear text if audio chosen
    }
  };

  /* ---------------- Submit ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim() && !audioFile) {
      setError("Please enter a question or upload audio");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      let res;
      if (audioFile) {
        const formData = new FormData();
        formData.append("audio_file", audioFile);
        formData.append("target_lang", translateLang.split("-")[0]);
        formData.append("source_lang", speechLang.split("-")[0]);
        formData.append("output_type", outputType);

        res = await fetch(`${API_URL}/VLT/content/v1/speech-pipeline`, {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch(`${API_URL}/VLT/content/v1/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: question.trim(),
            local_llm: useLocalLLM,
            target_lang: translateLang.split("-")[0], // FIX HERE
          }),
        });
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      if (audioFile) {
        if (outputType === "audio") {
          // 🎧 AUDIO RESPONSE
          const blob = await res.blob();
          const audioUrl = URL.createObjectURL(blob);

          setResponse({
            status: "success",
            message: "Audio generated",
            data: audioUrl,
          });
        } else {
          // 📝 TEXT RESPONSE
          const data = await res.json();

          setResponse({
            status: data.status,
            message: data.message,
            data: data.translated_text || data.english_text,
          });
        }
      } else {
        // 📝 Handle normal JSON response
        const data = await res.json();
        setResponse(data);
      }
    } catch (err) {
      setError(
        err.message ||
          "Failed to generate content. Please make sure the backend is running.",
      );
    } finally {
      setLoading(false);
      fetchHistory();
    }
  };

  const handleClear = () => {
    setQuestion("");
    setResponse(null);
    setError(null);
    setAudioFile(null);
  };

  const handleRemoveFile = () => {
    setAudioFile(null);

    // Reset hidden input value also
    const input = document.getElementById("audioUpload");
    if (input) input.value = "";
  };
  const swapLanguages = () => {
    const temp = speechLang;
    setSpeechLang(translateLang);
    setTranslateLang(temp);
  };

  const languages = [
    { code: "en-IN", name: "English" },
    { code: "hi-IN", name: "Hindi" },
    { code: "bn-IN", name: "Bengali" },
    { code: "ta-IN", name: "Tamil" },
    { code: "te-IN", name: "Telugu" },
    { code: "mr-IN", name: "Marathi" },
    { code: "gu-IN", name: "Gujarati" },
    { code: "kn-IN", name: "Kannada" },
    { code: "ml-IN", name: "Malayalam" },
    { code: "pa-IN", name: "Punjabi" },
    { code: "ur-IN", name: "Urdu" },
  ];

  const speakText = (text) => {
    if (!text) return;

    const speech = new SpeechSynthesisUtterance(text);

    // set language based on translate selection
    speech.lang = translateLang;

    window.speechSynthesis.cancel(); // stop previous speech
    window.speechSynthesis.speak(speech);
  };
  const stopSpeech = () => {
    window.speechSynthesis.cancel();
  };
  return (
    <div className="app">
      <div className="star-container">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${10 + Math.random() * 15}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          ></span>
        ))}
      </div>
      <div className="container">
        {/* Header */}
        <Header />

        <form onSubmit={handleSubmit} className="form">
          {/* Input text or voice */}
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

          {/* Audio Upload  */}
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            disabled={loading}
            id="audioUpload"
            style={{ display: "none" }}
          />

          {/* Button + File Name Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="button button-secondary"
              onClick={() => document.getElementById("audioUpload").click()}
              disabled={loading}
              style={{
                width: "200px",
                height: "40px",
                minWidth: "200px",
                flex: "0 0 200px",
              }}
            >
              Upload Audio
            </button>

            <div
              style={{
                position: "relative",
                display: "inline-block",
                maxWidth: "calc(100% - 210px)",
                minWidth: "120px",
              }}
            >
              {audioFile ? (
                <>
                  <span
                    title={audioFile.name}
                    style={{
                      fontSize: "14px",
                      padding: "8px 30px 8px 12px",
                      backgroundColor: "#e6f4ea",
                      color: "#1b5e20",
                      borderRadius: "6px",
                      fontWeight: "500",
                      display: "block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {audioFile.name}
                  </span>

                  {/* ❌ Remove Icon */}
                  <span
                    onClick={handleRemoveFile}
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-6px",
                      backgroundColor: "#1b5e20",
                      color: "white",
                      borderRadius: "50%",
                      width: "18px",
                      height: "18px",
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </span>
                </>
              ) : (
                <span style={{ fontSize: "14px", opacity: 0.7 }}>
                  No file chosen
                </span>
              )}
            </div>
          </div>

          <div className="language-selection-container">
            {/* Input Language Card */}
            <div className={`lang-card ${loading ? "disabled" : ""}`}>
              <label className="lang-mini-label">Source Language</label>
              <div className="select-wrapper">
                <span className="lang-icon">🌐</span>
                <select
                  className="professional-select"
                  value={speechLang}
                  onChange={(e) => setSpeechLang(e.target.value)}
                  disabled={loading}
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button - Now more prominent */}
            <button
              type="button"
              className="swap-circular-btn"
              onClick={swapLanguages}
              title="Swap Languages"
              disabled={loading}
            >
              <span className="swap-arrow">⇄</span>
            </button>

            {/* Target Language Card */}
            <div className={`lang-card ${loading ? "disabled" : ""}`}>
              <label className="lang-mini-label">Target Language</label>
              <div className="select-wrapper">
                <span className="lang-icon">🎯</span>
                <select
                  className="professional-select"
                  value={translateLang}
                  onChange={(e) => setTranslateLang(e.target.value)}
                  disabled={loading}
                >
                  {languages
                    .filter((lang) => lang.code !== speechLang)
                    .map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Output Format Segmented Control */}
          <div className="toggle-container">
            <div className="segment-wrapper">
              <span className="segment-label">Output Format</span>
              <div className="segmented-control">
                {/* The background pill that slides */}
                <div className={`selection-pill ${outputType}`}></div>

                <button
                  type="button"
                  className={`segment-btn ${outputType === "text" ? "active" : ""}`}
                  onClick={() => setOutputType("text")}
                >
                  Text
                </button>

                <button
                  type="button"
                  className={`segment-btn ${outputType === "audio" ? "active" : ""}`}
                  onClick={() => setOutputType("audio")}
                >
                  Audio
                </button>
              </div>
            </div>
          </div>

          {/* Generating Button */}
          <div className="button-group">
            <button
              type="submit"
              className="button button-primary"
              disabled={loading || (!question.trim() && !audioFile)}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="button-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 12H19M19 12L12 5M19 12L12 19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Generate Content
                </>
              )}
            </button>

            {(response || error) && (
              <button
                type="button"
                onClick={handleClear}
                className="button button-secondary"
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="alert alert-error">
            <svg
              className="alert-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 8V12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="12" cy="16" r="1" fill="currentColor" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        {response && (
          <div className="response-card">
            <div className="response-header">
              <svg
                className="response-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9 12L11 14L15 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              <h2 className="response-title">
                {response?.status
                  ? response.status.charAt(0).toUpperCase() +
                    response.status.slice(1)
                  : "Success"}
              </h2>
            </div>

            <p className="response-message">{response.message}</p>

            <div className="response-content">
              <h3 className="content-label">Generated Content:</h3>

              {outputType === "audio" ? (
                <audio controls src={response.data} style={{ width: "100%" }} />
              ) : (
                // 📝 TEXT RESPONSE
                <div style={{ position: "relative" }}>
                  {/* Speaker Button */}
                  <button
                    onClick={() => speakText(response.data)}
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "40px",
                      border: "none",
                      background: "transparent",
                      fontSize: "20px",
                      cursor: "pointer",
                    }}
                  >
                    🔊
                  </button>

                  {/* Stop Button */}
                  <button
                    onClick={stopSpeech}
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      border: "none",
                      background: "transparent",
                      fontSize: "20px",
                      cursor: "pointer",
                    }}
                  >
                    ⏹
                  </button>

                  <div className="content-text">{response.data}</div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="history-section">
          <div style={{ marginTop: "30px" }}>
            <h2>History</h2>

            {history.length === 0 ? (
              <p>No history yet</p>
            ) : (
              history.map((item, idx) => (
                <div className="history-item" key={idx}>
                  <p>
                    <strong>English:</strong> {item.question}
                  </p>
                  <p>
                    <strong>{item.target_lang}:</strong> {item.response}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default App;
