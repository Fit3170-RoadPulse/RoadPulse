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
    </div>
  );
}