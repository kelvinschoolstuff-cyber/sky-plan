import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { flushQueue } from "./api";
import "./styles.css";

class ErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error(error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main>
        <h2>Something went wrong</h2>
        <p>The page could not be shown. Reload and try again. If it keeps happening, tell the team what you were doing.</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </main>
    );
  }
}

createRoot(document.getElementById("root")).render(<ErrorBoundary><BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><App /></BrowserRouter></ErrorBoundary>);

flushQueue();
window.addEventListener("online", flushQueue);
if ("serviceWorker" in navigator && import.meta.env.PROD) navigator.serviceWorker.register("/sw.js");
