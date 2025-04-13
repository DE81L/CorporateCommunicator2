import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./setupMocks";          // 👈 add this line
import App from "./App";
import "./index.css";
import { installMockElectronAPI } from "./lib/web-polyfills";

// Install web polyfills if needed
if (import.meta.env.VITE_WEB_ONLY === 'true' || !import.meta.env.ELECTRON) {
  console.log('Running in web-only mode, installing polyfills...');
  installMockElectronAPI();
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
