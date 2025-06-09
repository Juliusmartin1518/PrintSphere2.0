import { createRoot } from "react-dom/client";
import App from "./App";
import { Router } from "wouter";

createRoot(document.getElementById("root")!).render(
  <Router base="/PrintSphere2.0">
    <App />
  </Router>
);
