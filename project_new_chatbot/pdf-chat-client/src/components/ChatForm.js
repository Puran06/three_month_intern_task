import React, { useState } from "react";
import axios from "axios";

const ChatForm = () => {
  const [mode, setMode] = useState(""); // "pdf", "url", "chat"
  const [sentence, setSentence] = useState("");
  const [url, setUrl] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setSentence("");
    setUrl("");
    setPdfFile(null);
    setResponse(null);
    setMode("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      const formData = new FormData();
      if (sentence) formData.append("sentence", sentence);
      if (url && mode === "url") formData.append("url", url);
      if (pdfFile && mode === "pdf") formData.append("pdf", pdfFile);

      const res = await axios.post("http://localhost:5000/api/chat", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResponse(res.data);
    } catch (err) {
      setResponse({
        error: err.response?.data?.error || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-wrapper">
      <div className="mode-buttons">
        <button
          className={mode === "pdf" ? "active" : ""}
          onClick={() => handleReset() || setMode("pdf")}
        >
          📄 Upload PDF
        </button>
        <button
          className={mode === "url" ? "active" : ""}
          onClick={() => handleReset() || setMode("url")}
        >
          🌐 Ask from URL
        </button>
        <button
          className={mode === "chat" ? "active" : ""}
          onClick={() => handleReset() || setMode("chat")}
        >
          🤖 Chat with AI
        </button>
      </div>

      {mode && (
        <form onSubmit={handleSubmit} className="chat-form">
          <label>
            Question:
            <input
              type="text"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              required
            />
          </label>

          {mode === "pdf" && (
            <div className="pdf-section">
              <label>
                Upload PDF:
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                />
              </label>
              {pdfFile && (
                <div className="file-info">
                  <span>📎 {pdfFile.name}</span>
                  <button type="button" onClick={() => setPdfFile(null)}>
                    ❌ Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === "url" && (
            <label>
              Website URL:
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </label>
          )}

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Processing..." : "Submit"}
            </button>
            <button type="button" onClick={handleReset} className="secondary">
              Reset
            </button>
          </div>
        </form>
      )}

      {response && (
        <div className="response-box">
          <h3>💡 Answer:</h3>
          <p>{response.answer || response.translation || response.response || response.error}</p>
        </div>
      )}
    </div>
  );
};

export default ChatForm;
