import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const registrationsResp = await fetch("/registrations/signedRegistrations.json");
const isJson = registrationsResp.headers.get("Content-Type")?.includes("application/json");

var registrations = "";

// For some reason, the dev server doesn't return 404 for missing files, so we check the content type
if (registrationsResp.ok && isJson) {
    registrations = await registrationsResp.text();
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App signedRegistrations={registrations} />
  </React.StrictMode>
);
