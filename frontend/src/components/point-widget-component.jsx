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
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [distanceKm, setDistanceKm] = useState(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [expirePoints, setExpirePoints] = useState(null);
  const [expireDate, setExpireDate] = useState("");

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

  // Placeholder: simulate fetching total distance travelled
  const mockFetchDistance = async (uid) => {
    await new Promise((r) => setTimeout(r, 400));
    // mock value in kilometres
    return { userId: uid, distanceKm: 123.4 };
  };

  const loadDistance = async () => {
    try {
      setDistanceLoading(true);
      const { distanceKm } = await mockFetchDistance(userId);
      setDistanceKm(distanceKm);
    } catch (e) {
      console.error("Failed to load distance");
    } finally {
      setDistanceLoading(false);
    }
  };

  // Placeholder: simulate fetching points expiry info
  const mockFetchExpiry = async (uid) => {
    await new Promise((r) => setTimeout(r, 250));
    return { userId: uid, expirePoints: 14, expireDate: "2025-10-31" };
  };

  const loadExpiry = async () => {
    try {
      const { expirePoints, expireDate } = await mockFetchExpiry(userId);
      setExpirePoints(expirePoints);
      // human-friendly date string
      setExpireDate(new Date(expireDate).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }));
    } catch (e) {
      console.error("Failed to load expiry info");
    }
  };

  useEffect(() => {
    load();
    loadHistory();
    loadDistance();
    loadExpiry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setShowBarcodeModal(false);
    };
    if (showBarcodeModal) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showBarcodeModal]);

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
    );
  }

  return (
  <div className="w-full max-w-sm rounded-2xl shadow p-4 bg-white border grid gap-3" style={{ backgroundColor: "#ff8a00" }}>
      <div>
        <h2 className="text-lg font-semibold">Points</h2>

        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-2">
            {/* Show history*/}
            <button
              onClick={() => setShowHistory(true)}
              className="px-3 py-1.5 rounded-xl border hover:bg-gray-50 active:scale-[0.99]"
              style={{ backgroundColor: "white", color: "#000000ff", borderColor: "#000000ff" }}
            >
              View History
            </button>
            {/* Distance is shown below automatically; removed toggle button */}
          </div>

          <div>
            <button
              onClick={load}
              className="px-3 py-1.5 rounded-xl border hover:bg-gray-50 active:scale-[0.99]"
              aria-label="Refresh points"
              style={{ backgroundColor: "white", color: "#000000ff", borderColor: "#000000ff" }}
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Barcode button */}
      <div className="flex justify-center mb-2">
        <button
          type="button"
          onClick={() => setShowBarcodeModal(true)}
          className="inline-flex items-center justify-center"
          aria-label="Open barcode in fullscreen"
          style={{ backgroundColor: "white", padding: 4, borderRadius: 6 }}
        >
          <svg width="120" height="40" viewBox="0 0 128 40" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="barcode">
            <rect x="4" y="4" width="6" height="32" fill="currentColor" />
            <rect x="14" y="4" width="4" height="32" fill="currentColor" />
            <rect x="22" y="4" width="6" height="32" fill="currentColor" />
            <rect x="32" y="4" width="4" height="32" fill="currentColor" />
            <rect x="40" y="4" width="8" height="32" fill="currentColor" />
            <rect x="52" y="4" width="4" height="32" fill="currentColor" />
            <rect x="60" y="4" width="6" height="32" fill="currentColor" />
            <rect x="70" y="4" width="8" height="32" fill="currentColor" />
            <rect x="82" y="4" width="4" height="32" fill="currentColor" />
            <rect x="90" y="4" width="6" height="32" fill="currentColor" />
            <rect x="100" y="4" width="4" height="32" fill="currentColor" />
            <rect x="108" y="4" width="8" height="32" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Balance card */}
      <div className="rounded-xl border p-4 text-center" style={{ backgroundColor: "#ff8a00", color: "white" }}>
        {loading ? (
          <div className="animate-pulse h-9 w-32 mx-auto rounded" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} aria-busy="true" />
        ) : error ? (
          <p className="text-sm" style={{ color: "white" }}>{error}</p>
        ) : (
          <p className="text-3xl font-bold" aria-live="polite">
            {formatter.format(points)}
          </p>
        )}
          {/* Expiry notice below the points */}
          {expirePoints != null && (
            <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.95)" }}>
              ⌛️ {expirePoints} points will expire by {expireDate}
            </p>
          )}
      </div>

      {/* Distance display (always shown) */}
      <div className="mt-3 w-full max-w-sm mx-auto rounded-lg border p-3 bg-white text-center">
        {distanceLoading ? (
          <p className="text-sm text-gray-500">Loading distance…</p>
        ) : distanceKm != null ? (
          <p className="text-sm">
            Total distance travelled: <strong>{distanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km</strong>
          </p>
        ) : (
          <p className="text-sm text-gray-500">No distance data available</p>
        )}
      </div>

      {/* Modal overlay for enlarged barcode */}
      {showBarcodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* dark overlay - clicking closes modal */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowBarcodeModal(false)}
            aria-hidden
          />

          <div className="relative z-10 p-4 max-w-[90vw]">
            <div className="rounded-lg bg-white p-6 shadow-lg">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowBarcodeModal(false)}
                  aria-label="Close barcode"
                  className="text-gray-600 hover:text-gray-900"
                >
                  ✕
                </button>
              </div>

              <div className="flex justify-center">
                <svg width="420" height="160" viewBox="0 0 420 160" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="enlarged-barcode">
                  {/* larger barcode stripes */}
                  <rect x="10" y="16" width="18" height="128" fill="#111" />
                  <rect x="38" y="16" width="12" height="128" fill="#111" />
                  <rect x="60" y="16" width="18" height="128" fill="#111" />
                  <rect x="92" y="16" width="12" height="128" fill="#111" />
                  <rect x="118" y="16" width="26" height="128" fill="#111" />
                  <rect x="156" y="16" width="12" height="128" fill="#111" />
                  <rect x="180" y="16" width="18" height="128" fill="#111" />
                  <rect x="210" y="16" width="26" height="128" fill="#111" />
                  <rect x="244" y="16" width="12" height="128" fill="#111" />
                  <rect x="268" y="16" width="18" height="128" fill="#111" />
                  <rect x="300" y="16" width="12" height="128" fill="#111" />
                  <rect x="324" y="16" width="26" height="128" fill="#111" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
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
