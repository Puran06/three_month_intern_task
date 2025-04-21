import React, { useState } from "react";
import axios from "axios";
import './styles/UploadForm.css';  // Importing the new CSS file for styling

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");  // Added for displaying the description
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setCaption("");
    setDescription("");  // Clear description when new file is selected
    setError("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Handle response (caption and description)
      setCaption(response.data.caption || "No caption returned");
      setDescription(response.data.description || "No description available");
    } catch (err) {
      console.error(err);
      setError("Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const renderImagePreview = () => {
    if (!file) return null;
    return <img src={URL.createObjectURL(file)} alt="preview" className="image-preview" />;
  };

  return (
    <div className="upload-container">
      <h2>Upload an Image for Captioning</h2>
      <form onSubmit={handleUpload} className="upload-form">
        <div className="file-input-container">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="file-input"
          />
          <button type="submit" disabled={loading} className="upload-button">
            {loading ? "Processing..." : "Upload"}
          </button>
        </div>
      </form>

      {renderImagePreview()}

      {caption && <p className="caption"><strong>Caption:</strong> {caption}</p>}
      {description && <p className="description"><strong>Description:</strong> {description}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default UploadForm;
