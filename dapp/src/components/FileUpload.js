import React, { useState } from "react";

function FileUpload({ onFileUpload }) {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => onFileUpload(e.target.result);
      reader.readAsText(file);
    }
  };

  return (
    <div style={{ width: "100%" }}>
      <label
        style={{
          display: "block",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#2196F3",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          textAlign: "center",
          width: "100%",
          boxSizing: "border-box"
        }}
      >
        {fileName ? "Change File" : "Choose File"}
        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </label>
      {fileName && (
        <p style={{ 
          marginTop: "10px", 
          textAlign: "center",
          color: "#666"
        }}>
          Selected file: {fileName}
        </p>
      )}
    </div>
  );
}

export default FileUpload;
