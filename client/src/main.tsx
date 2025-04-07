import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installMockElectronAPI } from "./lib/web-polyfills";

// Check if we're in web-only mode and install polyfills if needed
if (import.meta.env.ELECTRON === false || import.meta.env.VITE_WEB_ONLY === 'true') {
  console.log('Running in web-only mode, installing polyfills...');
  installMockElectronAPI();
}

// Initialize the application
createRoot(document.getElementById("root")!).render(<App />);
