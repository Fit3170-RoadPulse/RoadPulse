import { useEffect, useMemo, useState } from "react";

/**
 * PointsWidget
 * - Fetches and displays a user's point balance.
 * - Uses a placeholder fetch that returns a hardcoded value after a short delay.
 * - Swap `mockFetchPoints` with your real API call when ready.
 */
function PointsWidget({ userId = "demo-user" }) {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);

  // Placeholder: simulate an API call
  const mockFetchPoints = async (uid) => {
    // Simulate latency
    await new Promise((r) => setTimeout(r, 600));
    // Placeholder value; keep this while backend is WIP
    return { userId: uid, points: 1250 };
  };

  const mockFetchHistory = async (uid) => {
    await new Promise((r) => setTimeout(r, 500));
    return [
      //mock data
      { id: 1, date: "2025-10-15", time: "15:34:20", type: "Traffic Update", points: +100 },
      { id: 2, date: "2025-10-14", time: "15:29:41", type: "Accident Report", points: +200 },
      { id: 3, date: "2025-10-12", time: "13:19:02", type: "Reward Redemption", points: -300 },
    ];
  };

  const formatter = useMemo(() => new Intl.NumberFormat(undefined), []);

  const load = async () => {
    try {
      setError("");
      setLoading(true);
      const { points } = await mockFetchPoints(userId);
      setPoints(points);
    } catch (e) {
      setError("Failed to load points. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await mockFetchHistory(userId);
      setHistory(data);
    } catch (e) {
      console.error("Failed to load history");
    }
  };

  useEffect(() => {
    load();
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // When "View History" is clicked, toggle between points and history view
  if (showHistory) {
    return (
      <div className="mx-auto w-[min(92vw,384px)] rounded-2xl shadow p-6 bg-white border grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Points History</h2>
          <button
            onClick={() => setShowHistory(false)}
            className="px-3 py-1.5 bg-gray-200 text-white rounded-xl hover:bg-gray-300"
          >
            ← Back
          </button>
        </div>

        <div className="border-t mt-2 pt-2">
          {history.length === 0 ? (
            <p className="text-sm text-gray-500">No transactions yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {history.map((item) => (
                <li
                  key={item.id}
                  className="py-2 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-800">{item.type}</p>
                    <p className="text-xs text-gray-500">{item.date}</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                  <p
                    className={`font-semibold ${
                      item.points >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {item.points > 0 ? `+${item.points}` : item.points}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm rounded-2xl shadow p-4 bg-white border grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Points</h2>

        <div className="flex gap-2">
          {/* Show history*/}
          <button
            onClick={() => setShowHistory(true)}
            className="px-3 py-1.5 text-white rounded-xl border hover:bg-gray-50 active:scale-[0.99]"
          >
          View History
          </button>

          <button
            onClick={load}
            className="px-3 py-1.5 text-white rounded-xl border hover:bg-gray-50 active:scale-[0.99]"
            aria-label="Refresh points"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Balance card */}
      <div className="rounded-xl bg-gray-50 border p-4 text-center">
        {loading ? (
          <div className="animate-pulse h-9 w-32 mx-auto rounded bg-gray-200" aria-busy="true" />
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-3xl font-bold" aria-live="polite">
            {formatter.format(points)}
          </p>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        Placeholder data for development. Replace with a real API call when ready.
      </p>
    </div>
  );
}

export default function Demo() {
  return (
    <div className="min-h-[60vh] w-full grid place-items-center bg-gray-100 p-6">
      <PointsWidget />
    </div>
  );
}

/* ----------------------
 * Swap-in instructions (real API)
 * ----------------------
 * 1) Delete `mockFetchPoints` and use your fetch client:
 *    const fetchPoints = async (uid) => {
 *      const res = await fetch(`/api/users/${uid}/points`, { credentials: "include" });
 *      if (!res.ok) throw new Error("Network error");
 *      return res.json(); // -> { userId, points }
 *    };
 * 2) Replace calls to `mockFetchPoints` with `fetchPoints`.
 * 3) Pass the actual userId to <PointsWidget userId={currentUser.id} />.
 */
