import React, { useState } from "react";

function UseSignedRegistrations({ signedRegistrations, onFileUpload }) {
    if (!signedRegistrations) {
        return null;
    }
    return (
        <div>
            <p>A signed registrations file exists. Click the button below to use it.</p>
            <button onClick={event => onFileUpload(signedRegistrations)}>Use existing file</button>
            <hr />
            <p>If you want to upload a different file instead, use the "choose file" button below:</p>
        </div>
    );
}

export default UseSignedRegistrations;