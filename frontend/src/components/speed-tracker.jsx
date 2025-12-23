import { useEffect, useRef, useState } from "react";

export default function SpeedTracker({ intervalMs = 2000 }) {
  const [simulate, setSimulate] = useState(false);
  const [speedKmh, setSpeedKmh] = useState(null);
  const SPEED_LIMIT = 80;

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

  const speedColor =
    speedKmh == null
      ? "text-gray-400"
      : speedKmh > SPEED_LIMIT + 20
      ? "text-red-600"
      : speedKmh > SPEED_LIMIT
      ? "text-yellow-500"
      : "text-green-600";

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

      <div className={`mt-3 text-3xl font-bold ${speedColor}`}>
        {speedKmh ?? "--"} <span className="text-base font-medium text-gray-600">km/h</span>
        {speedKmh > SPEED_LIMIT && (
        <p className="mt-1 text-xs text-red-600 font-semibold">
          ⚠ Overspeeding
        </p>
      )}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {simulate
          ? "Simulation mode for development/demo (no GPS required)."
          : "GPS polling requires https on mobile browsers (localhost works on desktop)."}
      </p>
    </div>
  );
}