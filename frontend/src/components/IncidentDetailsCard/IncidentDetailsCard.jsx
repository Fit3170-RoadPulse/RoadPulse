import { useEffect, useMemo, useRef, useState } from "react";
import "./IncidentDetailsCard.css";

let lastKnownLocation = null; // { lat, lng, accuracyMeters }
let lastKnownLocationAtMs = 0;

export default function IncidentDetailsCard({ report, onClose, onReportUpdated, userLocation }) {
  const [address, setAddress] = useState(null);
  const geocodeCacheRef = useRef(new Map()); // "lat,lng" -> address string
  const [voteMessage, setVoteMessage] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [viewerLocation, setViewerLocation] = useState(null); // { lat, lng }
  const [locationStatus, setLocationStatus] = useState("unknown"); // unknown | ok | denied | error
  const geoWatchIdRef = useRef(null);

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

  const voteRadiusMeters = useMemo(() => {
    const raw = import.meta.env.VITE_INCIDENT_REPORT_VOTE_RADIUS_METERS;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 150;
  }, []);

  function distanceMeters(lat1, lng1, lat2, lng2) {
    const r = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * r * Math.asin(Math.sqrt(a));
  }

  useEffect(() => {
    if (!report) return;
    if (!navigator?.geolocation) {
      setLocationStatus("error");
      return;
    }
    setLocationStatus("unknown");

    // Optional: pages that already track user location (e.g. MapComponent) can pass it in
    // so distance shows instantly when opening a report.
    if (userLocation?.lat != null && userLocation?.lng != null) {
      const lat = Number(userLocation.lat);
      const lng = Number(userLocation.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        lastKnownLocation = { lat, lng, accuracyMeters: Number(userLocation.accuracyMeters) };
        lastKnownLocationAtMs = Date.now();
        setViewerLocation({ lat, lng });
        setLocationStatus("ok");
      }
    }

    // Use a recent cached fix immediately (reduces flicker on reopen).
    const nowMs = Date.now();
    if (lastKnownLocation && nowMs - lastKnownLocationAtMs < 30_000) {
      setViewerLocation({ lat: lastKnownLocation.lat, lng: lastKnownLocation.lng });
      setLocationStatus("ok");
    }

    // Start watching for a fresh fix while the card is open.
    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = Number(pos?.coords?.latitude);
        const lng = Number(pos?.coords?.longitude);
        const accuracyMeters = Number(pos?.coords?.accuracy);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setLocationStatus("error");
          return;
        }
        lastKnownLocation = { lat, lng, accuracyMeters };
        lastKnownLocationAtMs = Date.now();
        setViewerLocation({ lat, lng });
        setLocationStatus("ok");
      },
      (err) => {
        if (err?.code === 1) setLocationStatus("denied");
        else setLocationStatus("error");
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 8_000 }
    );

    return () => {
      if (geoWatchIdRef.current != null && navigator?.geolocation) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
    };
  }, [report?.id, userLocation?.lat, userLocation?.lng, userLocation?.accuracyMeters]);

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

  const distanceToReportMeters = useMemo(() => {
    if (!viewerLocation) return null;
    const lat = Number(report.latitude);
    const lng = Number(report.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return distanceMeters(lat, lng, viewerLocation.lat, viewerLocation.lng);
  }, [report.latitude, report.longitude, viewerLocation]);

  const distanceToReportLabel = useMemo(() => {
    const d = distanceToReportMeters;
    if (!Number.isFinite(d)) return null;
    if (d < 1000) return `${Math.round(d)} m away`;
    return `${(d / 1000).toFixed(2)} km away`;
  }, [distanceToReportMeters]);

  const canViewAndVoteByDistance = useMemo(() => {
    if (!isHazard) return false;
    if (!viewerLocation) return false;
    const lat = Number(report.latitude);
    const lng = Number(report.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
    const d = distanceMeters(lat, lng, viewerLocation.lat, viewerLocation.lng);
    return d <= voteRadiusMeters;
  }, [isHazard, report.latitude, report.longitude, viewerLocation, voteRadiusMeters]);

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
    if (!canViewAndVoteByDistance) {
      setVoteMessage({ type: "error", message: `You must be within ${Math.round(voteRadiusMeters)}m of the hazard to vote.` });
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
        body: JSON.stringify({
          choice,
          latitude: Number(viewerLocation?.lat).toFixed(6),
          longitude: Number(viewerLocation?.lng).toFixed(6),
        }),
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
      className="incident-card"
      style={{
        border: `1px solid ${theme.border}`,
        borderLeft: `8px solid ${theme.border}`,
      }}
    >
      <div
        aria-hidden="true"
        className="incident-card-accent"
        style={{
          background: `linear-gradient(90deg, ${theme.border} 0%, rgba(255,255,255,0) 70%)`,
        }}
      />
      <div className="incident-header">
        <div className="incident-header-content">
          <h1 className="incident-title">
            Incident details
          </h1>
          <div className="incident-badges">
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
          className="incident-close-btn"
        >
          ×
        </button>
      </div>

      <div className="incident-info-grid">
        <div className="incident-info-card">
          <div
            aria-hidden="true"
            className="incident-reporter-avatar"
            style={{
              background: theme.badgeBg,
              border: `1px solid ${theme.border}`,
              color: theme.badgeText,
            }}
          >
            {reporterInitial}
          </div>
          <div className="incident-reporter-info">
            <div className="incident-reporter-label">
              Reported by
            </div>
            <div className="incident-reporter-name">
              {reporterName}
            </div>
          </div>
        </div>
        <div className="incident-time-card">
          <div className="incident-time-label">Reported at</div>
          <div className="incident-time-value">
            {formatAustraliaDateTime(report.created_at)}
          </div>
        </div>
      </div>

      <div className="incident-location-section">
        <div className="incident-location-header">
          <div className="incident-location-title">Location</div>
          <div className="incident-location-coords">
            {Number.isFinite(Number(report.latitude)) && Number.isFinite(Number(report.longitude))
              ? `${Number(report.latitude).toFixed(6)}, ${Number(report.longitude).toFixed(6)}`
              : "-"}
          </div>
        </div>
        <div className="incident-location-address">
          {address || "Looking up address..."}
        </div>
        <div className="incident-location-distance">
          {distanceToReportLabel
            ? `Distance from you: ${distanceToReportLabel}`
            : locationStatus === "denied"
              ? "Distance from you: enable location to calculate"
              : locationStatus === "error"
                ? "Distance from you: location unavailable"
                : "Distance from you: locating..."}
        </div>
      </div>

      <div className="incident-details-section">
        <div className="incident-details-title">Details</div>
        <div className="incident-details-content">
          {report.description || "No additional details provided."}
        </div>
      </div>

      {isHazard ? (
        canViewAndVoteByDistance ? (
          <div className="incident-verification-section">
            <div className="incident-verification-header">
              <div className="incident-verification-title-group">
                <div className="incident-verification-title">Community verification</div>
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

            <div className="incident-verification-votes">
              Yes {report.yes_votes ?? 0} • No {report.no_votes ?? 0}
            </div>

            {hazardVerified ? (
              <div className="incident-verification-status incident-verification-status-verified">
                Verified hazard.
              </div>
            ) : hazardRejected ? (
              <div className="incident-verification-status incident-verification-status-rejected">
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
              <div className="incident-vote-buttons">
                <button
                  type="button"
                  onClick={() => submitVote("YES")}
                  disabled={!isLoggedIn || isReporter || isVoting || hasVoted}
                  className="incident-vote-button incident-vote-button-confirm"
                  style={{
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
                  className="incident-vote-button incident-vote-button-reject"
                  style={{
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
        ) : (
          <div className="incident-verification-disabled">
            <div className="incident-verification-disabled-title">Community verification</div>
            <div className="incident-verification-disabled-text">
              {locationStatus === "denied"
                ? "Enable location services to vote on this hazard report."
                : `Only users within ${Math.round(voteRadiusMeters)}m of the hazard can vote.`}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
