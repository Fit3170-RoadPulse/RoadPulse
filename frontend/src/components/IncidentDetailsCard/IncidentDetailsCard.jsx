import { useEffect, useMemo, useRef, useState } from "react";

export default function IncidentDetailsCard({ report, onClose, onReportUpdated }) {
  const [address, setAddress] = useState(null);
  const geocodeCacheRef = useRef(new Map()); // "lat,lng" -> address string
  const [voteMessage, setVoteMessage] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const reportTypeLabel = useMemo(() => {
    return {
      ACCIDENT: "Accident",
      HAZARD: "Hazard",
      WEATHER: "Weather",
      CRIME: "Crime",
      OTHER: "Other",
    };
  }, []);

  const reportTypeTheme = useMemo(() => {
    return {
      ACCIDENT: { badgeBg: "#FEF2F2", badgeText: "#991B1B", border: "#FCA5A5" },
      HAZARD: { badgeBg: "#FFF7ED", badgeText: "#9A3412", border: "#FDBA74" },
      WEATHER: { badgeBg: "#EFF6FF", badgeText: "#1D4ED8", border: "#93C5FD" },
      CRIME: { badgeBg: "#F5F3FF", badgeText: "#5B21B6", border: "#C4B5FD" },
      OTHER: { badgeBg: "#F3F4F6", badgeText: "#111827", border: "#D1D5DB" },
    };
  }, []);

  function getAccessToken() {
    const raw = (localStorage.getItem("access") || "").trim();
    return raw.replace(/^Bearer\\s+/i, "").replace(/^\"+|\"+$/g, "").trim();
  }

  function getRefreshToken() {
    const raw = (localStorage.getItem("refresh") || "").trim();
    return raw.replace(/^Bearer\\s+/i, "").replace(/^\"+|\"+$/g, "").trim();
  }

  function getCurrentUserIdFromToken() {
    const token = getAccessToken();
    if (!token || token.split(".").length !== 3) return null;
    try {
      const payloadPart = token.split(".")[1];
      const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "===".slice((base64.length + 3) % 4);
      const json = atob(padded);
      const payload = JSON.parse(json);
      const id = payload?.user_id ?? payload?.userId ?? payload?.sub;
      const n = Number(id);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }

  async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh || refresh.split(".").length !== 3) return null;

    const base = import.meta.env.VITE_API_URL || "";
    const res = await fetch(`${base}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = null;
    }
    const access = String(data?.access || "").trim();
    if (!access) return null;
    localStorage.setItem("access", access);
    return access;
  }

  useEffect(() => {
    const setFromToken = () => setCurrentUserId(getCurrentUserIdFromToken());
    setFromToken();
    window.addEventListener("rp:auth-changed", setFromToken);
    return () => window.removeEventListener("rp:auth-changed", setFromToken);
  }, []);

  useEffect(() => {
    setVoteMessage(null);
    setHasVoted(false);
  }, [report?.id]);

  function formatAustraliaDateTime(isoString) {
    if (!isoString) return "-";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return String(isoString);
    try {
      return new Intl.DateTimeFormat("en-AU", {
        timeZone: "Australia/Sydney",
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
    } catch {
      return date.toLocaleString("en-AU");
    }
  }

  useEffect(() => {
    setAddress(null);
    if (!report) return;

    const lat = Number(report.latitude);
    const lng = Number(report.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    const cached = geocodeCacheRef.current.get(cacheKey);
    if (cached) {
      setAddress(cached);
      return;
    }

    const g = window.google;
    if (!g?.maps?.Geocoder) return;
    const geocoder = new g.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== "OK" || !results?.length) return;
      const formatted = results[0]?.formatted_address;
      if (!formatted) return;
      geocodeCacheRef.current.set(cacheKey, formatted);
      setAddress(formatted);
    });
  }, [report]);

  if (!report) return null;

  const theme = reportTypeTheme[report.report_type] || reportTypeTheme.OTHER;
  const typeLabel = reportTypeLabel[report.report_type] || report.report_type;

  const isHazard = report.report_type === "HAZARD";
  const hazardStatus = String(report.status || "");
  const hazardVerified = isHazard && hazardStatus === "CONFIRMED";
  const hazardRejected = isHazard && hazardStatus === "REJECTED";
  const hazardVoteOpen = isHazard && hazardStatus === "OPEN" && report.is_active !== false;
  const reporterId = report.reporter?.id ? Number(report.reporter.id) : null;
  const isReporter = reporterId && currentUserId && reporterId === currentUserId;
  const isLoggedIn = Boolean(getAccessToken());

  const verificationBadge = useMemo(() => {
    if (!isHazard) return null;
    if (hazardVerified) {
      return { text: "Verified", bg: "#ECFDF5", border: "#A7F3D0", fg: "#065F46" };
    }
    if (hazardRejected) {
      return { text: "Rejected", bg: "#FEF2F2", border: "#FECACA", fg: "#991B1B" };
    }
    if (hazardStatus && hazardStatus !== "OPEN") {
      return { text: "Closed", bg: "#F3F4F6", border: "#E5E7EB", fg: "#374151" };
    }
    return null;
  }, [isHazard, hazardVerified, hazardRejected, hazardStatus]);

  const reporterName = report.reporter?.username || "Anonymous";
  const reporterInitial = String(reporterName || "A").trim().slice(0, 1).toUpperCase();
  const voteProgressPct = Math.min(
    100,
    Math.round((Number(report.total_votes ?? 0) / Math.max(1, Number(report.required_votes ?? 0))) * 100)
  );

  async function submitVote(choice) {
    if (!report?.id) return;
    setVoteMessage(null);

    let access = getAccessToken();
    if (!access) {
      setVoteMessage({ type: "error", message: "Please login to vote on hazard reports." });
      return;
    }
    if (access.split(".").length !== 3) {
      setVoteMessage({ type: "error", message: "Saved login token looks invalid. Please logout/login again." });
      return;
    }
    if (!hazardVoteOpen) {
      setVoteMessage({ type: "error", message: "This hazard report is closed." });
      return;
    }
    if (isReporter) {
      setVoteMessage({ type: "error", message: "You can’t vote on your own hazard report." });
      return;
    }
    if (hasVoted) return;

    const base = import.meta.env.VITE_API_URL || "";

    async function doPost(token) {
      return fetch(`${base}/api/incident-reports/${report.id}/vote/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ choice }),
      });
    }

    try {
      setIsVoting(true);
      let res = await doPost(access);
      if (res.status === 401) {
        const newAccess = await refreshAccessToken();
        if (newAccess) {
          access = newAccess;
          res = await doPost(access);
        }
      }

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg = data?.detail || (data ? JSON.stringify(data) : null) || text || `Vote failed (HTTP ${res.status}).`;
        setVoteMessage({ type: "error", message: msg });
        return;
      }

      setHasVoted(true);
      setVoteMessage({ type: "success", message: "Thanks — your vote has been recorded." });
      if (typeof onReportUpdated === "function") onReportUpdated(data);
    } catch (err) {
      console.error("Vote failed:", err);
      setVoteMessage({ type: "error", message: "Network error while submitting vote." });
    } finally {
      setIsVoting(false);
    }
  }

  return (
    <div
      className="mapholder"
      style={{
        width: "100%",
        maxHeight: "88vh",
        backgroundColor: "#FFFFFF",
        border: `1px solid ${theme.border}`,
        borderLeft: `8px solid ${theme.border}`,
        borderRadius: "18px",
        boxShadow: "0 14px 40px rgba(17, 24, 39, 0.14)",
        display: "flex",
        justifyContent: "flex-start",
        flexDirection: "column",
        alignItems: "stretch",
        padding: "18px 18px 16px 18px",
        fontSize: "1rem",
        color: "#1E1E1E",
        gap: "14px",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          height: "10px",
          margin: "-18px -18px 0 -18px",
          background: `linear-gradient(90deg, ${theme.border} 0%, rgba(255,255,255,0) 70%)`,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: 0, flex: "1 1 auto" }}>
          <h1 style={{ fontWeight: 850, fontSize: "1.35rem", color: "#111827", margin: 0, lineHeight: 1.2 }}>
            Incident details
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span
            style={{
              background: theme.badgeBg,
              color: theme.badgeText,
              border: `1px solid ${theme.border}`,
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "0.85rem",
              fontWeight: 650,
            }}
          >
            {typeLabel}
          </span>
          {verificationBadge ? (
            <span
              style={{
                background: verificationBadge.bg,
                color: verificationBadge.fg,
                border: `1px solid ${verificationBadge.border}`,
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "0.85rem",
                fontWeight: 650,
              }}
            >
              {verificationBadge.text}
            </span>
          ) : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => typeof onClose === "function" && onClose()}
          aria-label="Close incident details"
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "10px",
            border: "1px solid #E5E7EB",
            background: "#FFFFFF",
            cursor: "pointer",
            color: "#111827",
            fontSize: "18px",
            lineHeight: "1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(17, 24, 39, 0.10)",
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            padding: "12px 12px",
            color: "#111827",
            display: "flex",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "999px",
              background: theme.badgeBg,
              border: `1px solid ${theme.border}`,
              color: theme.badgeText,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 850,
              flex: "0 0 auto",
            }}
          >
            {reporterInitial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 750, color: "#6B7280", marginBottom: "4px" }}>
              Reported by
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 750, color: "#111827", overflow: "hidden", textOverflow: "ellipsis" }}>
              {reporterName}
            </div>
          </div>
        </div>
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "12px",
            padding: "12px 12px",
            color: "#111827",
          }}
        >
          <div style={{ fontSize: "0.8rem", fontWeight: 750, color: "#6B7280", marginBottom: "6px" }}>Reported at</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 650, color: "#111827" }}>
            {formatAustraliaDateTime(report.created_at)}
          </div>
        </div>
      </div>

      <div
        style={{
          background: "#F9FAFB",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "12px 12px",
          color: "#111827",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 850, color: "#374151" }}>Location</div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "#6B7280",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            }}
          >
            {Number.isFinite(Number(report.latitude)) && Number.isFinite(Number(report.longitude))
              ? `${Number(report.latitude).toFixed(6)}, ${Number(report.longitude).toFixed(6)}`
              : "-"}
          </div>
        </div>
        <div style={{ marginTop: "6px", fontSize: "0.95rem", color: "#111827", fontWeight: 650 }}>
          {address || "Looking up address..."}
        </div>
      </div>

      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: "12px",
          padding: "12px 12px",
          color: "#111827",
        }}
      >
        <div style={{ fontSize: "0.85rem", fontWeight: 850, color: "#374151", marginBottom: "6px" }}>Details</div>
        <div style={{ fontSize: "0.95rem", color: "#111827", whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
          {report.description || "No additional details provided."}
        </div>
      </div>

      {isHazard ? (
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "14px",
            padding: "14px 14px",
            color: "#111827",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 850, color: "#111827" }}>Community verification</div>
            </div>
            <span
              style={{
                background: verificationBadge?.bg || "#F3F4F6",
                color: verificationBadge?.fg || "#374151",
                border: `1px solid ${verificationBadge?.border || "#E5E7EB"}`,
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 750,
                whiteSpace: "nowrap",
              }}
            >
              {verificationBadge?.text || "Open"}
            </span>
          </div>

          <div style={{ fontSize: "0.85rem", color: "#6B7280" }}>
            Yes {report.yes_votes ?? 0} • No {report.no_votes ?? 0}
          </div>

          {hazardVerified ? (
            <div style={{ fontSize: "0.95rem", color: "#065F46", fontWeight: 700 }}>
              Verified hazard.
            </div>
          ) : hazardRejected ? (
            <div style={{ fontSize: "0.95rem", color: "#991B1B", fontWeight: 700 }}>
              Rejected report.
            </div>
          ) : null}

          {voteMessage ? (
            <div
              style={{
                background: voteMessage.type === "error" ? "#FEF2F2" : "#ECFDF5",
                border: `1px solid ${voteMessage.type === "error" ? "#FECACA" : "#A7F3D0"}`,
                color: voteMessage.type === "error" ? "#991B1B" : "#065F46",
                padding: "10px 12px",
                borderRadius: "12px",
              }}
              role="status"
              aria-live="polite"
            >
              {voteMessage.message}
            </div>
          ) : null}

          {hazardVoteOpen ? (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => submitVote("YES")}
                disabled={!isLoggedIn || isReporter || isVoting || hasVoted}
                style={{
                  flex: "1 1 160px",
                  borderRadius: "12px",
                  border: "1px solid #A7F3D0",
                  background: "#ECFDF5",
                  color: "#065F46",
                  padding: "11px 12px",
                  fontWeight: 800,
                  cursor: !isLoggedIn || isReporter || isVoting || hasVoted ? "not-allowed" : "pointer",
                  opacity: !isLoggedIn || isReporter || isVoting || hasVoted ? 0.6 : 1,
                }}
              >
                Confirm hazard
              </button>
              <button
                type="button"
                onClick={() => submitVote("NO")}
                disabled={!isLoggedIn || isReporter || isVoting || hasVoted}
                style={{
                  flex: "1 1 160px",
                  borderRadius: "12px",
                  border: "1px solid #FECACA",
                  background: "#FEF2F2",
                  color: "#991B1B",
                  padding: "11px 12px",
                  fontWeight: 800,
                  cursor: !isLoggedIn || isReporter || isVoting || hasVoted ? "not-allowed" : "pointer",
                  opacity: !isLoggedIn || isReporter || isVoting || hasVoted ? 0.6 : 1,
                }}
              >
                Not a hazard
              </button>
            </div>
          ) : null}

          {/* Intentionally keep this section minimal (no extra guidance text). */}
        </div>
      ) : null}
    </div>
  );
}
