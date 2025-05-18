import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { installMockElectronAPI } from "./lib/web-polyfills";
import { SettingsProvider } from "./hooks/use-settings";
import { LanguageProvider } from "./lib/i18n/LanguageContext";

// Install web polyfills if needed
if (import.meta.env.VITE_WEB_ONLY === 'true' || !import.meta.env.ELECTRON) {
  console.log('Running in web-only mode, installing polyfills...');
  installMockElectronAPI();
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <LanguageProvider>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </LanguageProvider>
  </StrictMode>
);
