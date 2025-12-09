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

  // Placeholder: simulate an API call
  const mockFetchPoints = async (uid) => {
    // Simulate latency
    await new Promise((r) => setTimeout(r, 600));
    // Placeholder value; keep this while backend is WIP
    return { userId: uid, points: 1250 };
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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return (
    <div className="w-full max-w-sm rounded-2xl shadow p-4 bg-white border grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Points</h2>
        <button
          onClick={load}
          className="px-3 py-1.5 text-white rounded-xl border hover:bg-gray-50 active:scale-[0.99]"
          aria-label="Refresh points"
        >
          Refresh
        </button>
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
