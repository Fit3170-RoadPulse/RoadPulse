// src/App.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

export default function App() {
  const [health, setHealth] = useState(null);
  const [samples, setSamples] = useState([]);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || "";
    axios.get(`${base}/api/health/`).then((r) => setHealth(r.data)).catch(() => setHealth(null));
    axios.get(`${base}/api/samples/`).then((r) => setSamples(r.data)).catch(() => setSamples([]));
  }, []);

  return (
    <div className="app-container">
      <h1>RoadPulse</h1>

      <h2>API Health</h2>
      <pre>{JSON.stringify(health, null, 2)}</pre>

      <h2>Samples</h2>
      <pre>{JSON.stringify(samples, null, 2)}</pre>

      <hr className="app-divider" />

      <button
        onClick={() => (window.location.href = "/registration-page")}
        className="app-button"
      >
        Register Page
      </button>

      <button
        onClick={() => (window.location.href = "/setting-menu-page")}
        className="app-button"
      >
        Go to Setting
      </button>

      <button
        onClick={() => (window.location.href = "/map")}
        className="app-button"
      >
        Go to Map
      </button>
    </div>
  );
}