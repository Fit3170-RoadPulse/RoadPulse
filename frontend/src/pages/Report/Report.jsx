import "./Report.css"
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import MapComponent from "../../components/MapComponent/MapComponent";
import MapPage from "../../components/MapSideBarComponent/MapSideBarComponent";
import ReportComponent from "@/components/ReportComponent/ReportComponent";
import IncidentDetailsCard from "../../components/IncidentDetailsCard/IncidentDetailsCard.jsx";
import { fetchMapConfig } from "../../lib/mapConfig";
import { NativeGeolocationProvider, WebGeolocationProvider } from "../../lib/geolocationFiles";

export default function Report() {
    let [isClicked, setIsClicked] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    let [mapData, setMapData] = useState(null);
    const [toast, setToast] = useState(null);
    const [reports, setReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const selectedReportRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);
    const mapInstanceRef = useRef(null);
    const [userLocation, setUserLocation] = useState(null);
    const prevLocationRef = useRef(null);
    const locationPollingDataRef = useRef({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    const geolocationProviderRef = useRef(null);
    const reportMarkersRef = useRef(new Map()); // id -> AdvancedMarkerElement
    const reportsByIdRef = useRef(new Map()); // id -> report
    const draftMarkerRef = useRef(null);
    const [reportSheetHeightVh, setReportSheetHeightVh] = useState(42);
    const reportSheetHeightRef = useRef(42);
    const reportDragActiveRef = useRef(false);
    const reportDragStartYRef = useRef(0);
    const reportDragStartHeightRef = useRef(42);
    const reportDragRafRef = useRef(null);

    function getAccessToken() {
        const raw = (localStorage.getItem("access") || "").trim();
        return raw.replace(/^Bearer\s+/i, "").replace(/^"+|"+$/g, "").trim();
    }

    function getAuthConfig() {
        const token = getAccessToken();
        return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
    }

    const fetchReports = useCallback(() => {
        const base = import.meta.env.VITE_API_URL || "";
        return axios
            .get(`${base}/api/incident-reports/`, getAuthConfig())
            .then((r) => setReports((Array.isArray(r.data) ? r.data : []).filter((x) => x?.is_active !== false)))
            .catch(() => setReports([]));
    }, []);

    useEffect(() => {
        fetchMapConfig()
            .then((data) => setMapData(data))
            .catch(() => setMapData(null));
    }, []);

    useEffect(() => {
        let mounted = true;
        const base = import.meta.env.VITE_API_URL || "";
        const isNativeApp = /Mobi|Android/i.test(navigator.userAgent);

        const startLocation = async () => {
            try {
                const r = await axios.get(`${base}/api/map/location/`);
                locationPollingDataRef.current = r.data;
            } catch (_) {
                // fall back to defaults
            }

            if (!mounted) return;
            const provider = isNativeApp
                ? new NativeGeolocationProvider()
                : new WebGeolocationProvider();
            geolocationProviderRef.current = provider;
            provider.start(prevLocationRef, locationPollingDataRef, (loc) => {
                if (!mounted) return;
                setUserLocation(loc);
            });
        };

        startLocation();

        return () => {
            mounted = false;
            geolocationProviderRef.current?.stop();
        };
    }, []);

    useEffect(() => {
        fetchReports();
    }, []);
    useEffect(() => {
        const t = setInterval(fetchReports, 15000);
        return () => clearInterval(t);
    }, []);
    useEffect(() => {
        const onAuthChanged = () => fetchReports();
        window.addEventListener("rp:auth-changed", onAuthChanged);
        return () => window.removeEventListener("rp:auth-changed", onAuthChanged);
    }, [fetchReports]);
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 3000);
        return () => clearTimeout(t);
    }, [toast]);
    console.log(mapData);

    useEffect(() => {
        const byId = new Map();
        for (const report of reports) byId.set(report.id, report);
        reportsByIdRef.current = byId;
    }, [reports]);
    useEffect(() => {
        if (!selectedReport) return;
        if (!reportsByIdRef.current.has(selectedReport.id)) {
            setSelectedReport(null);
        }
    }, [reports, selectedReport]);

    useEffect(() => {
        selectedReportRef.current = selectedReport;
    }, [selectedReport]);

    useEffect(() => {
        reportSheetHeightRef.current = reportSheetHeightVh;
    }, [reportSheetHeightVh]);


    const setReportSheetHeight = useCallback((nextHeight) => {
        if (reportDragRafRef.current) cancelAnimationFrame(reportDragRafRef.current);
        reportDragRafRef.current = requestAnimationFrame(() => {
            setReportSheetHeightVh(nextHeight);
        });
    }, []);

    const startReportDrag = useCallback((clientY) => {
        reportDragActiveRef.current = true;
        reportDragStartYRef.current = clientY;
        reportDragStartHeightRef.current = reportSheetHeightRef.current;
        document.body.classList.add("rp-report-dragging");
    }, []);

    const handleReportPointerMove = useCallback((event) => {
        if (!reportDragActiveRef.current) return;
        if (event.cancelable) event.preventDefault();
        event.stopPropagation();
        const deltaY = reportDragStartYRef.current - event.clientY;
        const deltaVh = (deltaY / window.innerHeight) * 100;
        const minVh = 32;
        const maxVh = 78;
        const nextHeight = Math.min(maxVh, Math.max(minVh, reportDragStartHeightRef.current + deltaVh));
        setReportSheetHeight(nextHeight);
    }, [setReportSheetHeight]);

    const handleReportPointerUp = useCallback(() => {
        if (!reportDragActiveRef.current) return;
        reportDragActiveRef.current = false;
        window.removeEventListener("pointermove", handleReportPointerMove);
        window.removeEventListener("pointerup", handleReportPointerUp);
        window.removeEventListener("pointercancel", handleReportPointerUp);
        document.body.classList.remove("rp-report-dragging");
        const minVh = 32;
        const maxVh = 78;
        const midpoint = (minVh + maxVh) / 2;
        const current = reportSheetHeightRef.current;
        const target = current >= midpoint ? maxVh : minVh;
        setReportSheetHeight(target);
    }, [handleReportPointerMove, setReportSheetHeight]);

    const handleReportPointerDown = useCallback((event) => {
        if (window.innerWidth > 768) return;
        event.preventDefault();
        event.stopPropagation();
        startReportDrag(event.clientY);
        window.addEventListener("pointermove", handleReportPointerMove, { passive: false });
        window.addEventListener("pointerup", handleReportPointerUp);
        window.addEventListener("pointercancel", handleReportPointerUp);
    }, [handleReportPointerMove, handleReportPointerUp, startReportDrag]);

    const handleReportTouchMove = useCallback((event) => {
        if (!reportDragActiveRef.current) return;
        event.preventDefault();
        const clientY = event.touches?.[0]?.clientY;
        if (typeof clientY !== "number") return;
        const deltaY = reportDragStartYRef.current - clientY;
        const deltaVh = (deltaY / window.innerHeight) * 100;
        const minVh = 32;
        const maxVh = 78;
        const nextHeight = Math.min(maxVh, Math.max(minVh, reportDragStartHeightRef.current + deltaVh));
        setReportSheetHeight(nextHeight);
    }, [setReportSheetHeight]);

    const handleReportTouchEnd = useCallback(() => {
        handleReportPointerUp();
        window.removeEventListener("touchmove", handleReportTouchMove);
        window.removeEventListener("touchend", handleReportTouchEnd);
        window.removeEventListener("touchcancel", handleReportTouchEnd);
    }, [handleReportPointerUp, handleReportTouchMove]);

    const handleReportSheetPointerDown = useCallback((event) => {
        if (window.innerWidth > 768) return;
        if (!event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const offsetY = event.clientY - rect.top;
        if (offsetY > 44) return;
        handleReportPointerDown(event);
    }, [handleReportPointerDown]);

    const handleReportSheetTouchStart = useCallback((event) => {
        if (window.innerWidth > 768) return;
        if (!event.currentTarget) return;
        const clientY = event.touches?.[0]?.clientY;
        if (typeof clientY !== "number") return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (clientY - rect.top > 44) return;
        startReportDrag(clientY);
        window.addEventListener("touchmove", handleReportTouchMove, { passive: false });
        window.addEventListener("touchend", handleReportTouchEnd);
        window.addEventListener("touchcancel", handleReportTouchEnd);
    }, [handleReportTouchEnd, handleReportTouchMove, startReportDrag]);

    useEffect(() => {
        return () => {
            document.body.classList.remove("rp-report-dragging");
            window.removeEventListener("pointermove", handleReportPointerMove);
            window.removeEventListener("pointerup", handleReportPointerUp);
            window.removeEventListener("pointercancel", handleReportPointerUp);
            window.removeEventListener("touchmove", handleReportTouchMove);
            window.removeEventListener("touchend", handleReportTouchEnd);
            window.removeEventListener("touchcancel", handleReportTouchEnd);
        };
    }, [handleReportPointerMove, handleReportPointerUp, handleReportTouchMove, handleReportTouchEnd]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!mapReady || !map) return;

        let cancelled = false;
        (async () => {
            const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
            if (cancelled) return;

            const markers = reportMarkersRef.current;
            const nextIds = new Set(reports.map((r) => r.id));

            for (const [id, marker] of markers.entries()) {
                if (!nextIds.has(id)) {
                    marker.map = null;
                    markers.delete(id);
                }
            }

            for (const report of reports) {
                if (markers.has(report.id)) continue;
                const lat = Number(report.latitude);
                const lng = Number(report.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

                const marker = new AdvancedMarkerElement({
                    map,
                    position: { lat, lng },
                    title: report.report_type,
                    content: createIncidentPinContent(report.report_type),
                });

                marker.addListener("gmp-click", () => {
                    const latest = reportsByIdRef.current.get(report.id) || report;
                    setSelectedReport(latest);
                    setIsClicked(false);
                });

                markers.set(report.id, marker);
            }
        })().catch((err) => {
            console.error("Failed to render incident report markers:", err);
        });

        return () => {
            cancelled = true;
        };
    }, [reports, mapReady]);

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

    const reportTypeIconSvg = useMemo(() => {
        const base = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
        return {
            ACCIDENT: `<svg viewBox="0 0 24 24" width="30" height="30" ${base}> <!-- Left car --> <path d="M3 13h7l1.5-2.5a2 2 0 0 1 1.7-1h1.8"/> <path d="M4 13l-1 2"/> <path d="M9 13l1 2"/> <circle cx="5" cy="17" r="1"/> <circle cx="9" cy="17" r="1"/> <!-- Right car --> <path d="M21 13h-7l-1.5-2.5a2 2 0 0 0-1.7-1H9.5"/> <path d="M20 13l1 2"/> <path d="M15 13l-1 2"/> <circle cx="15" cy="17" r="1"/> <circle cx="19" cy="17" r="1"/> <!-- Impact --> <path d="M11.2 11.8l.8-.8l.8.8"/> <path d="M12 10v-1"/> <path d="M10.8 10.8l-.8-.8"/> <path d="M13.2 10.8l.8-.8"/> </svg>`,
            HAZARD: `<svg viewBox="0 0 24 24" width="22" height="22" ${base}><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z"/></svg>`,
            WEATHER: `<svg viewBox="0 0 24 24" width="22" height="22" ${base}><path d="M17.5 19a4.5 4.5 0 0 0-.9-8.9A6 6 0 0 0 5 12.2 3.8 3.8 0 0 0 5.5 20H17.5Z"/></svg>`,
            CRIME: `<svg viewBox="0 0 24 24" width="22" height="22" ${base}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>`,
            OTHER: `<svg viewBox="0 0 24 24" width="22" height="22" ${base}><path d="M12 12h.01"/><path d="M19 12h.01"/><path d="M5 12h.01"/></svg>`,
        };
    }, []);

    function createPinShell({ borderColor, iconColor, iconSvg }) {
        const root = document.createElement("div");
        root.style.position = "relative";
        root.style.width = "42px";
        root.style.height = "60px";
        root.style.transform = "translateY(-6px)";
        root.style.pointerEvents = "auto";

        const pin = document.createElement("div");
        pin.style.position = "absolute";
        pin.style.left = "50%";
        pin.style.top = "0";
        pin.style.width = "42px";
        pin.style.height = "42px";
        pin.style.transform = "translateX(-50%) rotate(45deg)";
        pin.style.borderRadius = "22px 22px 22px 4px";
        pin.style.background = "#FFFFFF";
        pin.style.border = `2px solid ${borderColor}`;
        pin.style.boxShadow = "0 10px 22px rgba(17, 24, 39, 0.22)";

        const inner = document.createElement("div");
        inner.style.position = "absolute";
        inner.style.left = "50%";
        inner.style.top = "50%";
        inner.style.width = "28px";
        inner.style.height = "28px";
        inner.style.transform = "translate(-50%, -50%) rotate(-45deg)";
        inner.style.display = "flex";
        inner.style.alignItems = "center";
        inner.style.justifyContent = "center";
        inner.style.color = iconColor;
        inner.innerHTML = iconSvg;

        pin.appendChild(inner);

        const dot = document.createElement("div");
        dot.style.position = "absolute";
        dot.style.left = "50%";
        dot.style.bottom = "4px";
        dot.style.width = "7px";
        dot.style.height = "7px";
        dot.style.transform = "translateX(-50%)";
        dot.style.borderRadius = "999px";
        dot.style.background = borderColor;

        root.appendChild(pin);
        root.appendChild(dot);
        return root;
    }

    function createIncidentPinContent(reportType) {
        const theme = reportTypeTheme[reportType] || reportTypeTheme.OTHER;
        const icon = reportTypeIconSvg[reportType] || reportTypeIconSvg.OTHER;
        return createPinShell({
            borderColor: theme.border,
            iconColor: theme.badgeText,
            iconSvg: icon,
        });
    }

    function createDraftPinContent() {
        const plus = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>';
        return createPinShell({
            borderColor: "#111827",
            iconColor: "#111827",
            iconSvg: plus,
        });
    }

    function formatAustraliaDateTime(isoString) {
        if (!isoString) return "-";
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return String(isoString);
        try {
            return new Intl.DateTimeFormat("en-AU", {
                timeZone: "Australia/Sydney",
                dateStyle: "medium",
                timeStyle: "short",
                timeZoneName: "short",
            }).format(date);
        } catch {
            return date.toLocaleString("en-AU");
        }
    }

    const ReportLocation = useCallback(async (map) => {
        mapInstanceRef.current = map;
        setMapReady(true);
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        map.addListener("click", (e) => {
            if (selectedReportRef.current) {
                setSelectedReport(null);
                return;
            }

            const centerPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setSelectedReport(null);
            setSelectedLocation(centerPos);
            setIsClicked(true);

            if (draftMarkerRef.current) {
                draftMarkerRef.current.map = null;
            }

            draftMarkerRef.current = new AdvancedMarkerElement({
                map: map,
                position: centerPos,
                title: "New report location",
            });

            map.setCenter(centerPos);
            map.setZoom(14);
        });
    }, []);

    return (
        <div className="report-container">
            {toast ? (
                <div
                    className={`report-toast ${toast.type === "error" ? "report-toast-error" : "report-toast-success"}`}
                    role="status"
                    aria-live="polite"
                >
                    {toast.message}
                </div>
            ) : null}

            <div className="report-map-wrapper">
                <MapComponent
                    API_KEY={mapData?.GMAPS_KEY}
                    MAP_ID={mapData?.GMAPS_ID}
                    map_function={ReportLocation}
                    showUserLocation={false}
                    onUserLocation={null}
                    useExternalUserLocation
                    externalUserLocation={userLocation}
                />
            </div>
            <div className={`report-sidebar-container ${(isClicked || selectedReport) ? "report-sidebar-container-active" : "report-sidebar-container-inactive"}`}>
                <div className="report-sidebar-content">
                    {(selectedReport || isClicked) ? (
                        <div
                            className="report-sheet"
                            style={{ "--report-sheet-height": `${reportSheetHeightVh}vh` }}
                            onPointerDown={handleReportSheetPointerDown}
                            onTouchStart={handleReportSheetTouchStart}
                        >
                            <button
                                type="button"
                                className="report-sheet-handle"
                                aria-label="Drag to resize report sheet"
                            />
                            <div className="report-sheet-scroll">
                                {selectedReport ? (
                                    <IncidentDetailsCard
                                        report={selectedReport}
                                        onClose={() => setSelectedReport(null)}
                                        userLocation={userLocation}
                                        onReportUpdated={(updated) => {
                                            if (!updated?.id) return;
                                            setSelectedReport(updated);
                                            setReports((prev) => {
                                                const next = prev.map((r) => (r.id === updated.id ? updated : r));
                                                return (updated?.is_active === false) ? next.filter((r) => r.id !== updated.id) : next;
                                            });
                                        }}
                                    />
                                ) : (
                                    <ReportComponent
                                        location={selectedLocation}
                                        onClose={() => setIsClicked(false)}
                                        onSubmitted={(newReport) => {
                                            if (newReport?.id) {
                                                setReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
                                            }
                                            if (draftMarkerRef.current) {
                                                draftMarkerRef.current.map = null;
                                                draftMarkerRef.current = null;
                                            }
                                            setToast({ type: "success", message: "Report submitted." });
                                            setIsClicked(false);
                                            if (newReport?.id) setSelectedReport(newReport);
                                        }}
                                    />
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="overlay-ui report-overlay-ui">  {/* Set pointerEvents to Auto so Google maps doesn't eat all the clicks above the UI region*/}
                <MapPage onSearch={() => console.log("Search triggered!")} />
            </div>
        </div>
    );
}
