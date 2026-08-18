import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RecitationApp } from "./app/recitation-app";
import "./app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RecitationApp />
  </StrictMode>,
);
