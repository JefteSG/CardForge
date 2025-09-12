import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// DEV: Guard against non-standard errors (e.g., 3rd-party scripts) that crash the Vite error overlay
if (import.meta.env.DEV) {
  window.addEventListener('error', (ev: ErrorEvent) => {
    try {
      const err = ev.error as any;
      // If error object exists but lacks a stack/frame structure, stop propagation to avoid overlay crash
      if (err && typeof err === 'object' && !err.stack) {
        ev.stopImmediatePropagation();
        // keep a console warning for debugging
        // eslint-disable-next-line no-console
        console.warn('Suppressed non-standard error to avoid dev overlay crash:', err);
      }
    } catch (e) {
      ev.stopImmediatePropagation();
    }
  }, true);

  window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
    try {
      const reason = ev.reason as any;
      if (reason && typeof reason === 'object' && !reason.stack) {
        ev.stopImmediatePropagation();
        // eslint-disable-next-line no-console
        console.warn('Suppressed non-standard promise rejection to avoid dev overlay crash:', reason);
      }
    } catch (e) {
      ev.stopImmediatePropagation();
    }
  }, true);
}

createRoot(document.getElementById("root")!).render(<App />);
