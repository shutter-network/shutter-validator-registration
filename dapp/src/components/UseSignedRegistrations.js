import React, { useState } from "react";

function UseSignedRegistrations({ signedRegistrations, onFileUpload }) {
    if (!signedRegistrations) {
        return null;
    }
    return (
        <div style={{ width: "100%" }}>
            <p style={{
                marginBottom: "10px",
                textAlign: "center",
                color: "#666"
            }}>
                A signed registrations file exists. Click the button below to use it.
            </p>
            <button
                onClick={event => onFileUpload(signedRegistrations)}
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
                    boxSizing: "border-box",
                    marginBottom: "20px"
                }}
            >
                Use Existing File
            </button>
            <hr />
            <p style={{
                marginTop: "20px",
                textAlign: "center",
                color: "#666"
            }}>
                If you want to upload a different file instead, use the "choose file" button below:
            </p>
        </div>
    );
}

export default UseSignedRegistrations;