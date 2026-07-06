import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply persisted theme (dark/light) before render so every page respects it
try {
  const stored = localStorage.getItem('theme');
  if (stored === 'dark') document.documentElement.classList.add('dark');
  else if (stored === 'light') document.documentElement.classList.remove('dark');
} catch { /* ignore */ }

createRoot(document.getElementById("root")!).render(<App />);
