import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./hooks/useAuth";
import { registerServiceWorker } from "./lib/reminders";
import { ErrorBoundary, startMonitoring } from "@/lib/monitoring";
import "./index.css";

startMonitoring();
registerServiceWorker();

/** Shown if a screen crashes. The notebook is saved as you write, so reloading loses nothing. */
function Crashed() {
  return (
    <div className="mx-auto grid min-h-dvh max-w-md place-items-center px-6 text-center">
      <div className="space-y-3">
        <div className="text-5xl">🛠️</div>
        <h1 className="text-xl font-extrabold">Something went wrong on this screen</h1>
        <p className="text-muted">Your notebook is safe. We've been told about the problem. Reload to carry on.</p>
        <button className="btn-primary" onClick={() => location.reload()}>Reload Flowz</button>
      </div>
    </div>
  );
}

// The demo runs inside a hosted frame where the address bar can't be used for routing.
const Router = import.meta.env.MODE === "demo" ? MemoryRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary fallback={<Crashed />}>
      <Router>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  </StrictMode>,
);
