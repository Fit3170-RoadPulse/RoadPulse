import { useEffect, useRef, useState } from "react";

export default function SpeedTracker({ speedKmh }) {
  console.log("SpeedTracker received speedKmh:", speedKmh);

  const SPEED_LIMIT = 80;

  const speedColor =
    speedKmh == null
      ? "text-gray-400"
      : speedKmh > SPEED_LIMIT + 20
      ? "text-red-600"
      : speedKmh > SPEED_LIMIT
      ? "text-yellow-500"
      : "text-green-600";

  return (
    <div className="rounded-2xl border bg-white p-4 shadow w-50 text-left">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Speed Tracking</h2>
      </div>

      <div className={`mt-3 text-3xl font-bold ${speedColor}`}>
        {speedKmh ?? "--"}{" "}
        <span className="text-base font-medium text-gray-600">km/h</span>

        {speedKmh != null && speedKmh > SPEED_LIMIT && (
          <p className="mt-1 text-xs text-red-600 font-semibold">⚠ Overspeeding</p>
        )}
      </div>
    </div>
  );
}