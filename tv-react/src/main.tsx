import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Sin StrictMode a propósito: en desarrollo duplicaría la carga inicial y el polling.
createRoot(document.getElementById("root")!).render(<App />);
