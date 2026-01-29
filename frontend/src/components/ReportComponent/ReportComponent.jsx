import "./ReportComponent.css"
import { useEffect, useMemo, useRef, useState } from "react";

export default function ReportComponent({ location, onClose, onSubmitted, onDetailsFocus, onDetailsBlur }) {
    const [reportType, setReportType] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState(null);
    const [locationAddress, setLocationAddress] = useState(null);
    const geocodeCacheRef = useRef(new Map()); // "lat,lng" -> address string

    function getAccessToken() {
        const raw = (localStorage.getItem("access") || "").trim();
        const withoutPrefix = raw.replace(/^Bearer\s+/i, "").trim();
        const withoutQuotes = withoutPrefix.replace(/^"+|"+$/g, "").trim();
        return withoutQuotes;
    }

    function getRefreshToken() {
        const raw = (localStorage.getItem("refresh") || "").trim();
        const withoutPrefix = raw.replace(/^Bearer\s+/i, "").trim();
        const withoutQuotes = withoutPrefix.replace(/^"+|"+$/g, "").trim();
        return withoutQuotes;
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

    const canSubmit = useMemo(() => {
        return Boolean(location && reportType && description.trim() && !isSubmitting);
    }, [location, reportType, description, isSubmitting]);

    const locationLabel = useMemo(() => {
        if (!location) return "Click the map to choose a location.";
        return locationAddress || "Looking up address…";
    }, [location, locationAddress]);

    const locationCoordsLabel = useMemo(() => {
        const lat = Number(location?.lat);
        const lng = Number(location?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "-";
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }, [location]);

    const descriptionMaxLen = 280;

    useEffect(() => {
        setLocationAddress(null);
        if (!location) return;

        const lat = Number(location.lat);
        const lng = Number(location.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
        const cached = geocodeCacheRef.current.get(cacheKey);
        if (cached) {
            setLocationAddress(cached);
            return;
        }

        if (typeof google === "undefined" || !google.maps?.Geocoder) return;
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status !== "OK" || !results?.length) return;
            const address = results[0]?.formatted_address;
            if (!address) return;
            geocodeCacheRef.current.set(cacheKey, address);
            setLocationAddress(address);
        });
    }, [location]);

    async function submitReport() {
        setFormMessage(null);
        const token = getAccessToken();
        if (!token) {
            setFormMessage({ type: "error", message: "Please login first so we can link the report to your account." });
            return;
        }
        if (token.split(".").length !== 3) {
            setFormMessage({ type: "error", message: "Saved login token looks invalid. Please logout/login again." });
            return;
        }
        if (!location) {
            setFormMessage({ type: "error", message: "Please pick a location on the map first." });
            return;
        }
        if (!reportType) {
            setFormMessage({ type: "error", message: "Please pick an incident type." });
            return;
        }
        if (!description.trim()) {
            setFormMessage({ type: "error", message: "Please enter a description." });
            return;
        }

        const base = import.meta.env.VITE_API_URL || "";
        setIsSubmitting(true);
        try {
            const body = JSON.stringify({
                report_type: reportType,
                description: description.trim(),
                latitude: Number(location.lat).toFixed(6),
                longitude: Number(location.lng).toFixed(6),
            });

            async function doPost(accessToken) {
                return fetch(`${base}/api/incident-reports/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body,
                });
            }

            let res = await doPost(token);
            if (res.status === 401) {
                const newAccess = await refreshAccessToken();
                if (newAccess) {
                    res = await doPost(newAccess);
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
                console.error("Report submit failed:", {
                    status: res.status,
                    statusText: res.statusText,
                    body: text,
                });
                const message =
                    data?.detail ||
                    (data ? JSON.stringify(data) : null) ||
                    text ||
                    `Failed to submit report (HTTP ${res.status}).`;
                setFormMessage({ type: "error", message });
                if (
                    typeof message === "string" &&
                    message.toLowerCase().includes("token not valid")
                ) {
                    localStorage.removeItem("access");
                    localStorage.removeItem("refresh");
                }
                return;
            }

            setReportType("");
            setDescription("");
            setFormMessage({ type: "success", message: "Report submitted successfully." });
            if (typeof onSubmitted === "function") onSubmitted(data);
        } catch (err) {
            console.error(err);
            setFormMessage({ type: "error", message: "Network error while submitting report." });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="rp-report-card">
            <div className="rp-report-accent" aria-hidden="true" />

            <div className="rp-report-header">
                <div className="rp-report-header-content">
                    <h1 className="rp-report-title">New incident report</h1>
                    <div className="rp-report-subtitle">
                        Submit a report to help keep other drivers informed.
                    </div>
                </div>
                <button
                    type="button"
                    className="rp-icon-btn"
                    onClick={() => typeof onClose === "function" && onClose()}
                    aria-label="Close report form"
                >
                    ×
                </button>
            </div>

            {formMessage ? (
                <div
                    className={[
                        "rp-alert",
                        formMessage.type === "error" ? "rp-alert-error" : "rp-alert-success",
                    ].join(" ")}
                    role="status"
                    aria-live="polite"
                >
                    {formMessage.message}
                </div>
            ) : null}

            <div className="rp-report-section">
                <div className="rp-section-title">Location</div>
                <div className="rp-section-main">{locationLabel}</div>
                <div className="rp-section-meta">{locationCoordsLabel}</div>
            </div>

            <div className="rp-form">
                <div className="rp-field">
                    <div className="rp-label-row">
                        <label className="rp-label" htmlFor="incidentType">Incident type</label>
                    </div>
                    <select
                        className="rp-select"
                        name="incidentType"
                        id="incidentType"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                    >
                        <option value="" disabled>Pick a type</option>
                        <option value="ACCIDENT">Accident</option>
                        <option value="HAZARD">Hazard</option>
                        <option value="WEATHER">Weather</option>
                        <option value="CRIME">Crime</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>

                <div className="rp-field">
                    <div className="rp-label-row">
                        <label className="rp-label" htmlFor="description">Details</label>
                        <div className="rp-helper">{Math.min(description.length, descriptionMaxLen)}/{descriptionMaxLen}</div>
                    </div>
                    <textarea
                        className="rp-textarea"
                        id="description"
                        name="description"
                        placeholder="Describe what happened (what, where, and any hazards)."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onFocus={onDetailsFocus}
                        onBlur={onDetailsBlur}
                        maxLength={descriptionMaxLen}
                        required
                    />
                </div>

                <div className="rp-actions">
                    <button
                        type="button"
                        className="rp-primary-btn"
                        onClick={submitReport}
                        disabled={!canSubmit}
                    >
                        {isSubmitting ? "Submitting…" : "Submit report"}
                    </button>
                </div>
            </div>
        </div>
    );
}
