import "./ReportComponent.css"
import { useEffect, useMemo, useRef, useState } from "react";

export default function ReportComponent({ location, onClose, onSubmitted }) {
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
            if (typeof onSubmitted === "function") onSubmitted(data);
        } catch (err) {
            console.error(err);
            setFormMessage({ type: "error", message: "Network error while submitting report." });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mapholder" style={{ 
            width: '100%', 
            height: '50vh', 
            backgroundColor: "#F4F4F4",
            borderColor:"black",
            borderWidth:"2px",
            borderRadius: "2rem",
            display: "flex",
            justifyContent: "center",
            flexDirection:"column",
            alignItems: "baseline",
            paddingLeft: "2rem",
            paddingRight: "2rem",
            fontSize:"1rem",
            fontWeight:"light",
            color:"#1E1E1E",
            }}>
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h1 style={{
                    fontWeight:"bold",
                    fontSize:"2rem",
                    color:"black",
                    marginBottom:"1rem"
                }}>New Incident Report</h1>
                <button
                    type="button"
                    onClick={() => typeof onClose === "function" && onClose()}
                    aria-label="Close report form"
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
                        marginBottom: "1rem",
                    }}
                >
                    ×
                </button>
            </div>
            {formMessage ? (
                <div
                    style={{
                        width: "100%",
                        background: formMessage.type === "error" ? "#fef2f2" : "#ecfdf5",
                        border: `1px solid ${formMessage.type === "error" ? "#fecaca" : "#a7f3d0"}`,
                        color: formMessage.type === "error" ? "#991b1b" : "#065f46",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        marginBottom: "12px",
                    }}
                    role="status"
                    aria-live="polite"
                >
                    {formMessage.message}
                </div>
            ) : null}
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
                <div style={{ fontSize: "0.9rem", color: "#333" }}>
                    Address: {!location ? "Click the map" : (locationAddress || "Looking up…")}
                </div>
            </div>
            <div style={{
                display: "flex",
                justifyContent: "center",
                flexDirection:"column",
                alignItems: "baseline",
                gap:"1rem",
                width:"100%"
                }}>
                <div style={{
                    display:"flex",
                    justifyContent:"center",
                    flexDirection:"column",
                    gap:"0.2rem",
                    width:"100%"
                }}>
                    <label htmlFor="incidentType">Incident Type</label>
                    <select 
                        name="incidentType" 
                        id="incidentType"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                        style = {{
                            width: "100%",
                            backgroundColor: "white"
                        }}>
                        <option value="" disabled>Pick a type</option>
                        <option value="ACCIDENT">Accident</option>
                        <option value="HAZARD">Hazard</option>
                        <option value="WEATHER">Weather</option>
                        <option value="CRIME">Crime</option>
                        <option value="OTHER">Other</option>
                    </select>
                </div>
                <div style={{
                    display:"flex",
                    justifyContent:"center",
                    flexDirection:"column",
                    width:"100%",
                    gap:"0.2rem"
                }}>
                    <label htmlFor="description">Description</label>
                    <textarea  
                    id="description"
                    name="description"
                    placeholder="Additional Details"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                        backgroundColor:"white",
                        width:"100%",
                    }}
                    required/>
                </div>

                <div style={{
                    display:"flex",
                    justifyContent:"left",
                }}>
                    <button
                        type="button"
                        onClick={submitReport}
                        disabled={!canSubmit}
                        style={{
                        backgroundColor:"black",
                        color:"white",
                        paddingLeft:"1rem",
                        paddingRight:"1rem",
                        paddingTop:"0.3rem",
                        paddingBottom:"0.3rem",
                        fontSize:"1rem",
                        fontWeight:"normal",
                        borderRadius:0,
                        opacity: canSubmit ? 1 : 0.6,
                        cursor: canSubmit ? "pointer" : "not-allowed",
                    }}
                    >
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </button>
                </div>
            </div>
        </div>
    );
}
