import { useEffect, useMemo, useRef, useState } from "react";

export default function IncidentDetailsCard({ report, onClose }) {
  const [address, setAddress] = useState(null);
  const geocodeCacheRef = useRef(new Map()); // "lat,lng" -> address string

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

  return (
    <div
      className="mapholder"
      style={{
        width: "100%",
        height: "52vh",
        backgroundColor: "#FFFFFF",
        border: `1px solid ${theme.border}`,
        borderLeft: `8px solid ${theme.border}`,
        borderRadius: "18px",
        boxShadow: "0 10px 30px rgba(17, 24, 39, 0.12)",
        display: "flex",
        justifyContent: "flex-start",
        flexDirection: "column",
        alignItems: "stretch",
        padding: "18px 18px 16px 18px",
        fontSize: "1rem",
        color: "#1E1E1E",
        gap: "14px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <h1 style={{ fontWeight: 750, fontSize: "1.35rem", color: "#111827", margin: 0 }}>
            Incident details
          </h1>
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
          }}
        >
          <div style={{ fontSize: "0.8rem", fontWeight: 750, color: "#6B7280", marginBottom: "6px" }}>Reported by</div>
          <div style={{ fontSize: "0.95rem", fontWeight: 650, color: "#111827" }}>
            {report.reporter?.username || "Anonymous"}
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
          <div style={{ fontSize: "0.8rem", fontWeight: 750, color: "#6B7280", marginBottom: "6px" }}>Created at</div>
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
        <div style={{ fontSize: "0.85rem", fontWeight: 750, color: "#374151", marginBottom: "6px" }}>Address</div>
        <div style={{ fontSize: "0.95rem", color: "#111827" }}>{address || "Looking up..."}</div>
        <div style={{ marginTop: "8px", fontSize: "0.85rem", color: "#6B7280" }}>
          {Number.isFinite(Number(report.latitude)) && Number.isFinite(Number(report.longitude))
            ? `${Number(report.latitude).toFixed(6)}, ${Number(report.longitude).toFixed(6)}`
            : "-"}
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
        <div style={{ fontSize: "0.85rem", fontWeight: 750, color: "#374151", marginBottom: "6px" }}>Description</div>
        <div style={{ fontSize: "0.95rem", color: "#111827", whiteSpace: "pre-wrap" }}>{report.description || "-"}</div>
      </div>
    </div>
  );
}

