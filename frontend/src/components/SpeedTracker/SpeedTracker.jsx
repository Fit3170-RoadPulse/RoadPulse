import "./SpeedTracker.css";

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
    <div className="speed-card">
      <div className="speed-card-header">
        <h2 className="speed-card-title">Speed Tracking</h2>
      </div>

      <div className={`speed-value ${speedColor}`}>
        {typeof speedKmh === "number" ? speedKmh.toFixed(2) : "--"}
        <span className="speed-unit"> km/h</span>

        {speedKmh != null && speedKmh > SPEED_LIMIT && (
          <p className="speed-warning">⚠ Overspeeding</p>
        )}
      </div>
    </div>
  );
}