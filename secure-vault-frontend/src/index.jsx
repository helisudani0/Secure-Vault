import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <div className="app-container">
      <App />
    </div>
  </React.StrictMode>
);
