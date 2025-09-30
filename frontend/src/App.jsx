// src/App.jsx
import { useEffect, useState } from "react";
import axios from "axios";

export default function App() {
  const [health, setHealth] = useState(null);
  const [samples, setSamples] = useState([]);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || "";
    axios.get(`${base}/api/health/`).then((r) => setHealth(r.data)).catch(() => setHealth(null));
    axios.get(`${base}/api/samples/`).then((r) => setSamples(r.data)).catch(() => setSamples([]));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>RoadPulse</h1>

      <h2>API Health</h2>
      <pre>{JSON.stringify(health, null, 2)}</pre>

      <h2>Samples</h2>
      <pre>{JSON.stringify(samples, null, 2)}</pre>

      <hr style={{ margin: "24px 0" }} />

      <button
        onClick={() => (window.location.href = "/login-page")}
        style={{
          marginBottom: 20,
          padding: "8px 14px",
          borderRadius: 8,
          background: "#0b74de",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Go to Login
      </button>


      <button
        onClick={() => (window.location.href = "/setting-menu-page")}
        style={{
          marginBottom: 20,
          padding: "8px 14px",
          borderRadius: 8,
          background: "#0b74de",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Go to Setting
      </button>

      <button
        onClick={() => (window.location.href = "/map-page")}
        style={{
          marginBottom: 20,
          padding: "8px 14px",
          borderRadius: 8,
          background: "#0b74de",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Go to Map
      </button>
    </div>
  );
}
