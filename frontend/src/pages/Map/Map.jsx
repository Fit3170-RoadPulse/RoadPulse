import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { User, Award, Settings, LogOut } from "lucide-react";
import MapComponent from "../../components/MapComponent/MapComponent";
import MapPage from "../../components/MapSideBarComponent/MapSideBarComponent";
import "./Map.css"
import RewardsPage from "../rewardspage/RewardsPage";
import IncidentDetailsCard from "../../components/IncidentDetailsCard/IncidentDetailsCard.jsx";

export default function Map() {
    let [mapData, setMapData] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [points] = useState(1000); // Replace with actual user points
    const navigate = useNavigate();
    const [selectedReport, setSelectedReport] = useState(null);
    const [reports, setReports] = useState([]);
    const mapReadyRef = useRef(false);
    const mapInstanceRef = useRef(null);
    const reportMarkersRef = useRef(new globalThis.Map()); // id -> AdvancedMarkerElement

    useEffect(() => {
        const base = import.meta.env.VITE_API_URL || "";
        axios.get(`${base}/api/map/`).then((r) => {
            setMapData(r.data)
        });
    }, []);
    useEffect(() => {
        const base = import.meta.env.VITE_API_URL || "";
        const fetchReports = () =>
            axios
                .get(`${base}/api/incident-reports/`)
                .then((r) => setReports((Array.isArray(r.data) ? r.data : []).filter((x) => x?.is_active !== false)))
                .catch(() => {});

        fetchReports();
        const t = setInterval(fetchReports, 15000);
        return () => clearInterval(t);
    }, []);
    console.log(mapData);

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
            ACCIDENT: { badgeText: "#991B1B", border: "#FCA5A5" },
            HAZARD: { badgeText: "#9A3412", border: "#FDBA74" },
            WEATHER: { badgeText: "#1D4ED8", border: "#93C5FD" },
            CRIME: { badgeText: "#5B21B6", border: "#C4B5FD" },
            OTHER: { badgeText: "#111827", border: "#D1D5DB" },
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

    const createIncidentPinContent = useCallback((reportType) => {
        const theme = reportTypeTheme[reportType] || reportTypeTheme.OTHER;
        const icon = reportTypeIconSvg[reportType] || reportTypeIconSvg.OTHER;

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
        pin.style.border = `2px solid ${theme.border}`;
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
        inner.style.color = theme.badgeText;
        inner.innerHTML = icon;

        pin.appendChild(inner);

        const dot = document.createElement("div");
        dot.style.position = "absolute";
        dot.style.left = "50%";
        dot.style.bottom = "4px";
        dot.style.width = "7px";
        dot.style.height = "7px";
        dot.style.transform = "translateX(-50%)";
        dot.style.borderRadius = "999px";
        dot.style.background = theme.border;

        root.appendChild(pin);
        root.appendChild(dot);
        return root;
    }, [reportTypeIconSvg, reportTypeTheme]);

    const handleRewardsClick = () => {
        setShowDropdown(false);
        navigate("/rewards-page"); // Navigate to rewards page
    };

    const handleSettingsClick = () => {
        setShowDropdown(false);
        navigate("/setting-menu-page"); // Navigate to settings page
    };


    const setMarker = useCallback(async (map) => {
        if (mapReadyRef.current) return;
        mapReadyRef.current = true;
        mapInstanceRef.current = map;

        let originMarker = null;
        let directionsRenderer = null;
        let trafficLayer = null;
        let destinationMarker = null;
        const g = window.google;
        if (!g?.maps?.importLibrary) return;
        const { AdvancedMarkerElement } = await g.maps.importLibrary("marker");

        trafficLayer = new g.maps.TrafficLayer();
        trafficLayer.setMap(map);

        directionsRenderer = new g.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        map.addListener("click", () => {
            setSelectedReport(null);
        });

        map.addListener("click", () => {
            setSelectedReport(null);
        });

        map.addListener("click", (e) =>{
            const clicked = { lat: e.latLng.lat(), lng: e.latLng.lng() };

            if (!originMarker){
                originMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title:"A",
                });
                directionsRenderer.setDirections(null);
            }else if (!destinationMarker){
                destinationMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title:"B",
                });
                buildRoute(originMarker.position,destinationMarker.position, directionsRenderer);
            } else{
                originMarker.map = null;
                destinationMarker.map =null;
                directionsRenderer.setDirections(null);

                originMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title:"A",
                });
                destinationMarker = null;
            }
        });
    }, [createIncidentPinContent, reportTypeLabel]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!mapReadyRef.current || !map) return;

        let cancelled = false;
        (async () => {
            const g = window.google;
            if (!g?.maps?.importLibrary) return;
            const { AdvancedMarkerElement } = await g.maps.importLibrary("marker");
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
                marker.addListener("gmp-click", () => setSelectedReport(report));
                markers.set(report.id, marker);
            }
        })().catch((err) => console.error("Failed to render incident report markers:", err));

        return () => {
            cancelled = true;
        };
    }, [createIncidentPinContent, reports]);

    useEffect(() => {
        if (!selectedReport) return;
        if (!reports.some((r) => r.id === selectedReport.id)) {
            setSelectedReport(null);
        }
    }, [reports, selectedReport]);

    function buildRoute(origin,destination,directionsRenderer){
        const g = window.google;
        if (!g?.maps?.DirectionsService) return;
        const directionsService = new g.maps.DirectionsService();
        directionsService.route(
            {
                origin,
                destination,
                travelMode: g.maps.TravelMode.DRIVING,
            },
            (result, status) =>{
                if (status === "OK"){
                    directionsRenderer.setDirections(result) 
                } else{
                    console.error("Direction request failed:" + status)
                }
            }
        )
    }

    return (
            <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
                <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: '100px', 
                    right: 0, 
                    bottom: 0, 
                    zIndex: 1,
                    pointerEvents: "auto"
                    }}>
                    <MapComponent API_KEY={mapData?.GMAPS_KEY} MAP_ID={mapData?.GMAPS_ID} map_function={setMarker}/>
                </div>

                {/* Incident details panel (same UI as Report tab) */}
                <div style={{
                    zIndex: selectedReport ? 10 : 0,
                    position: "absolute",
                    top: 0,
                    left: "60vw",
                    width: "35vw",
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    pointerEvents: "none",
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        flexDirection: "column",
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                    }}>
                        {selectedReport ? (
                            <div style={{ pointerEvents: "auto" }}>
                                <IncidentDetailsCard report={selectedReport} onClose={() => setSelectedReport(null)} />
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Overlay UI */}
                <div className="overlay-ui" 
                style={{
                pointerEvents: "none"
                }}>  {/* Set pointerEvents to Auto so Google maps doesn't eat all the clicks above the UI region*/}
                    <MapPage onSearch={() => console.log("Search triggered!")} />
                </div>

                {/* Profile Icon with Dropdown */}
                <div style={{
                    position: 'absolute',
                    top: '60px',
                    right: '20px',
                    zIndex: 1000,
                    pointerEvents: 'auto'
                }}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            outline: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                        <User size={24} color="#374151" />
                    </button>
    
                    {showDropdown && (
                        <div style={{
                            position: 'absolute',
                            top: '60px',
                            right: '0',
                            width: '240px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                            border: '1px solid #e5e7eb',
                            overflow: 'hidden',
                            zIndex: 1001
                        }}>
                            {/* User Info Section */}
                            <div style={{
                                padding: '16px',
                                borderBottom: '1px solid #e5e7eb'
                            }}>
                                <p style={{
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#1f2937',
                                    margin: '0 0 4px 0'
                                }}>Jack</p>
                                <p style={{
                                    fontSize: '12px',
                                    color: '#6b7280',
                                    margin: 0
                                }}>{points} Points</p>
                            </div>
    
                            {/* Menu Items */}
                            <div>
                                <button
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'background-color 0.2s',
                                        color: '#374151',
                                        outline: 'none'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <User size={20} color="#374151" />
                                    <span style={{ fontSize: '14px' }}>Profile</span>
                                </button>
    
                                <button
                                    onClick={handleRewardsClick}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'background-color 0.2s',
                                        color: '#374151',
                                        outline: 'none'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fefaefff'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Award size={20} color="#FFB20F" />
                                    <span style={{ fontWeight: '500', fontSize: '14px' }}>Rewards</span>
                                </button>
    
                                <button
                                    onClick={handleSettingsClick}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'background-color 0.2s',
                                        color: '#374151',
                                        outline: 'none'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Settings size={20} color="#374151" />
                                    <span style={{ fontSize: '14px' }}>Settings</span>
                                </button>
                            </div>
    
                            {/* Logout Section */}
                            <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '8px' }}>
                                <button
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        transition: 'background-color 0.2s',
                                        color: '#dc2626',
                                        outline: 'none'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <LogOut size={20} color="#dc2626" />
                                    <span style={{ fontSize: '14px' }}>Logout</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
    
                {/* Click outside to close dropdown */}
                {showDropdown && (
                    <div
                        onClick={() => setShowDropdown(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 999
                        }}
                    />
                )}

            </div>
        ); 
}
