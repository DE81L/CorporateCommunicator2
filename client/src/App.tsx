
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomePage from "./pages/home-page";
import { LanguageProvider } from "./lib/i18n/LanguageContext";
import "./index.css";

const qc = new QueryClient();

export default function App() {
//   // install the fake backend once
//   useEffect(() => {
//     window.chatAPI.onBootstrap((d) => {
//       localStorage.setItem("username", d.username);
//     });
//     import("./setupMocks");
//   }, []);

  return (
    <QueryClientProvider client={qc}>
      <LanguageProvider>
        <HomePage />
      </LanguageProvider>
    </QueryClientProvider>
  );
}
