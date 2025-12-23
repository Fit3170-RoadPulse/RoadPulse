import { useEffect, useRef, useState } from "react";

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // meters
  const toRad = (d) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function SpeedTracker({ intervalMs = 2000 }) {
  const [simulate, setSimulate] = useState(false);
  const [speedKmh, setSpeedKmh] = useState(null);

  useEffect(() => {
    let timer;

    if (simulate) {
      // Fake speed updates every interval (demo-friendly)
      timer = setInterval(() => {
        setSpeedKmh((prev) => {
          const base = prev ?? 35;
          const next = base + (Math.random() * 10 - 5); // +/- 5 km/h
          return Math.max(0, Math.round(next));
        });
      }, intervalMs);

      return () => clearInterval(timer);
    }

    // Real GPS polling
    timer = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const s = pos.coords.speed;
          if (typeof s === "number") setSpeedKmh(Math.max(0, Math.round(s * 3.6)));
        },
        (err) => {
          console.warn(err.message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }, intervalMs);

    return () => clearInterval(timer);
  }, [simulate, intervalMs]);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow w-64 text-left -translate-x-16">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Speed Tracking</h2>
        <button
          className="px-3 py-1.5 rounded-xl text-sm border"
          onClick={() => setSimulate((v) => !v)}
        >
          {simulate ? "Use GPS" : "Simulate"}
        </button>
      </div>

      <div className="mt-3 text-3xl font-bold">
        {speedKmh ?? "--"} <span className="text-base font-medium text-gray-600">km/h</span>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {simulate
          ? "Simulation mode for development/demo (no GPS required)."
          : "GPS polling requires https on mobile browsers (localhost works on desktop)."}
      </p>
    </div>
  );
}