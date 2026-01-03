import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { User, Award, Settings, LogOut, X, AlertTriangle } from "lucide-react";
import MapComponent from "../../components/MapComponent/MapComponent";
import MapPage from "../../components/MapSideBarComponent/MapSideBarComponent";
import "./Map.css"
import { fetchRewardAccount, clearAuth, isAuthenticated, apiPost } from "../../lib/api";
import IncidentDetailsCard from "../../components/IncidentDetailsCard/IncidentDetailsCard.jsx";
import { Easing, Tween } from "@tweenjs/tween.js";


export default function Map() {
    let [mapData, setMapData] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [points, setPoints] = useState(0);
    const [username, setUsername] = useState("");
    const navigate = useNavigate();
    const [routeInfo, setRouteInfo] = useState(null); // Changed to single route object
    const [mapMarkers, setMapMarkers] = useState({ origin: null, destination: null });
    const [mapPolylines, setMapPolylines] = useState([]);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [selectedOffsetMinutes, setSelectedOffsetMinutes] = useState(1);
    const [showTimeSelector, setShowTimeSelector] = useState(false);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [mapRef, setMapRef] = useState(null);
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const lastRouteSelectionRef = useRef(null);

    const [cumulativeDistance, setCumulativeDistance] = useState(0);
    const prevLocationRef = useRef(null);
    let locationPollingData = useRef(null);
    let lastUpdateTimeRef = useRef(0);
    const routeCacheRef = useRef(new globalThis.Map());
    const activeRouteRequestRef = useRef(null);

    // Fallback mock location (used if real geolocation fails)
    const mockLocation = {
        latitude: -37.813904798147796,
        longitude: 144.98810008133233,
        accuracy: 50,
        timestamp: Date.now(),
    };
    const [selectedReport, setSelectedReport] = useState(null);
    const [reports, setReports] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const mapReadyRef = useRef(false);
    const mapInstanceRef = useRef(null);
    const reportMarkersRef = useRef(new globalThis.Map()); // id -> AdvancedMarkerElement
    const trafficLayerRef = useRef(null);
    const isAToBRef = useRef(true);
    const [isAToBState, setIsAToBState] = useState(true);

    useEffect(() => {
        const base = import.meta.env.VITE_API_URL || "";
        axios.get(`${base}/api/map/`).then((r) => {
            setMapData(r.data)
        });

        // Fetch user data if authenticated
        async function loadUserData() {
            if (!isAuthenticated()) {
                return; // Don't redirect, just don't load user data
            }

            try {
                const data = await fetchRewardAccount();
                setPoints(data.reward_points);
                setUsername(data.username);
            } catch (err) {
                console.error("Failed to fetch user data:", err);
                // If authentication failed, clear tokens
                if (err.message.includes("Authentication failed")) {
                    clearAuth();
                }
            }
        }

        loadUserData();

        axios.get(`${base}/api/map/location/`).then((r) => {
            locationPollingData.current = r.data;
            console.log("Location Polling Data Ref:", locationPollingData);

            if (!navigator.geolocation) {
                prevLocationRef.current = mockLocation;
                console.log('Geolocation is not supported by your browser');
                return;
            }

            // Success handler: updates the state with the new position
            const successHandler = (position) => {
                const now = Date.now();
                if (now - lastUpdateTimeRef.current < locationPollingData.current?.pollingInterval) return;

                const newLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp,
                };

                const prev = prevLocationRef.current;
                let distance = 0;

                if (prev) {
                    distance = google.maps.geometry.spherical.computeDistanceBetween(
                        new google.maps.LatLng(prev.latitude, prev.longitude),
                        new google.maps.LatLng(newLocation.latitude, newLocation.longitude)
                    );
                }

                // update "previous" immediately
                prevLocationRef.current = newLocation;

                // filter jitter + jumps
                const MIN_MOVE_M = 10;
                const MAX_MOVE_M = 500;

                if (distance >= MIN_MOVE_M && distance <= MAX_MOVE_M) {
                    setCumulativeDistance((prevDist) => prevDist + distance);

                    if (isAuthenticated()) {
                        apiPost("/user/distance/", { distance_m: distance }).catch((err) =>
                            console.error("Failed to persist distance:", err)
                        );
                    }
                }

                lastUpdateTimeRef.current = now;
                console.log("Distance moved (m):", distance);
                console.log("Location updated:", newLocation);
            };

            // Error handler: updates the error state
            const errorHandler = (err) => {
                console.error("Geolocation error:", {
                    code: err.code,
                    message: err.message,
                });
                prevLocationRef.current = mockLocation;
                console.log("Location updated:", mockLocation);
            };

            // Options object for watchPosition (optional)
            const options = {
                enableHighAccuracy: locationPollingData.current?.enableHighAccuracy,
                timeout: locationPollingData.current?.timeout ?? 10000,
                maximumAge: locationPollingData.current?.maximumAge ?? 0,
            };

            // Start watching the position and store the watch ID
            const id = navigator.geolocation.watchPosition(
                successHandler,
                errorHandler,
                options
            );

            // Cleanup function: stops watching the position when the component unmounts
            return () => {
                if (id) {
                    navigator.geolocation.clearWatch(id);
                }
            };
        });
    }, []);
    useEffect(() => {
        const base = import.meta.env.VITE_API_URL || "";
        const fetchReports = () =>
            axios
                .get(`${base}/api/incident-reports/`)
                .then((r) => setReports((Array.isArray(r.data) ? r.data : []).filter((x) => x?.is_active !== false)))
                .catch(() => { });

        fetchReports(); // Initial fetch
        const interval = setInterval(fetchReports, 15000); // Poll every 15 seconds

        // Re-fetch when auth changes
        const onAuthChanged = () => fetchReports();
        window.addEventListener("rp:auth-changed", onAuthChanged);

        return () => {
            clearInterval(interval);
            window.removeEventListener("rp:auth-changed", onAuthChanged);
        };
    }, []);

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

    const handleLogout = () => {
        clearAuth(); // Clear JWT tokens (access and refresh)
        setShowLogoutConfirm(false);
        // Use replace: true to prevent back button from returning to authenticated pages
        navigate("/", { replace: true });
    };

    const clearMap = () => {
        // Clear markers
        if (mapMarkers.origin) mapMarkers.origin.map = null;
        if (mapMarkers.destination) mapMarkers.destination.map = null;
        setMapMarkers({ origin: null, destination: null });

        // Clear polylines
        mapPolylines.forEach(polyline => polyline.setMap(null));
        setMapPolylines([]);

        // Clear route info and time selector
        setRouteInfo(null);
        setShowTimeSelector(false);
        setAvailableTimes([]);
        setSelectedOffsetMinutes(1);
    };

    useEffect(() => {
        if (!showTimeSelector) return;
        let cancelled = false;

        const refreshTimes = () => {
            if (cancelled) return;
            const times = generateStartTimes();
            setAvailableTimes(times);
            if (!selectedOffsetMinutes) {
                setSelectedOffsetMinutes(times[0]?.offsetMinutes ?? 1);
            }
        };

        refreshTimes();
        const intervalId = setInterval(refreshTimes, 30000);
        return () => {
            cancelled = true;
            clearInterval(intervalId);
        };
    }, [showTimeSelector, selectedOffsetMinutes]);

    const setMarker = useCallback(async (map) => {
        if (mapReadyRef.current) return;
        mapReadyRef.current = true;
        mapInstanceRef.current = map;
        setMapReady(true);
        setMapRef(map);

        let originMarker = mapMarkers.origin;
        let destinationMarker = mapMarkers.destination;

        const g = window.google;
        if (!g?.maps?.importLibrary) return;
        const { AdvancedMarkerElement } = await g.maps.importLibrary("marker");

        // trafficLayer = new g.maps.TrafficLayer();
        // trafficLayer.setMap(map);
        if (!trafficLayerRef.current) {
            trafficLayerRef.current = new g.maps.TrafficLayer();
            trafficLayerRef.current.setMap(map);
        }

        //directionsRenderer = new google.maps.DirectionsRenderer();
        //directionsRenderer.setMap(map);

        map.addListener("click", () => {
            setSelectedReport(null);
        });

        map.addListener("click", (e) => {
            const clicked = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            console.log(isAToBRef.current, "isAToB");
            console.log("currentlocation ", prevLocationRef.current);

            if (!isAToBRef.current && prevLocationRef.current) {
                // Use current location as origin
                console.log("Setting origin to user location:", prevLocationRef.current);
                originMarker = new AdvancedMarkerElement({
                    map: map,
                    position: { lat: prevLocationRef.current.latitude, lng: prevLocationRef.current.longitude },
                    title: "A",
                });
            }

            if (!originMarker) {
                originMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title: "A",
                });
                // directionsRenderer.setDirections(null);
            } else if (!destinationMarker) {
                destinationMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title: "B",
                });
                setMapMarkers({ origin: originMarker, destination: destinationMarker });

                // Generate available times and show selector
                const times = generateStartTimes();
                setAvailableTimes(times);
                setSelectedOffsetMinutes(times[0]?.offsetMinutes ?? 1);
                setShowTimeSelector(true);

                // Fetch route for first time option
                fetchRoute(originMarker.position, destinationMarker.position, times[0].offsetMinutes, map);
            } else {
                // Clear previous markers
                originMarker.map = null;
                destinationMarker.map = null;
                // directionsRenderer.setDirections(null);

                // Clear all previous polylines from the MAP using the STATE via callback
                setMapPolylines(currentPolylines => {
                    currentPolylines.forEach(polyline => polyline.setMap(null));
                    return []; // Return empty array to clear state
                });

                // Clear route info and time selector
                setRouteInfo(null);
                setShowTimeSelector(false);
                setAvailableTimes([]);
                setSelectedOffsetMinutes(1);

                // Start new route

                if (!isAToBRef.current && prevLocationRef.current) {
                    // Use current location as origin
                    console.log("Setting origin to user location:", prevLocationRef.current);
                    originMarker = new AdvancedMarkerElement({
                        map: map,
                        position: { lat: prevLocationRef.current.latitude, lng: prevLocationRef.current.longitude },
                        title: "A",
                    });
                }
                else {
                    originMarker = new AdvancedMarkerElement({
                        map: map,
                        position: clicked,
                        title: "A",
                    });
                }
                destinationMarker = null;
                setMapMarkers({ origin: originMarker, destination: null });
            }
        });
    }, [createIncidentPinContent, reportTypeLabel]);

    // Clears map when switching
    useEffect(() => {
        isAToBRef.current = isAToBState;
        clearMap();
    }, [isAToBState, isAToBRef]);

    const handleTimeChange = async (index) => {
        const map = mapRef || mapInstanceRef.current;
        if (!mapMarkers.origin || !mapMarkers.destination || !availableTimes[index] || !map) return;

        const selectedOffset = availableTimes[index].offsetMinutes;
        if (isLoadingRoute) return;
        if (selectedOffsetMinutes === selectedOffset && routeInfo) return;

        setIsLoadingRoute(true);

        // Clear existing polylines from map
        mapPolylines.forEach(polyline => polyline.setMap(null));

        // Clear polylines state immediately
        setMapPolylines([]);

        // Fetch new route for selected time
        await fetchRoute(mapMarkers.origin.position, mapMarkers.destination.position, selectedOffset, map);
        setSelectedOffsetMinutes(selectedOffset);
    };

    function normalizeLatLng(pos) {
        const lat = typeof pos.lat === "function" ? pos.lat() : pos.lat;
        const lng = typeof pos.lng === "function" ? pos.lng() : pos.lng;
        return { lat, lng };
    }

    function buildRouteCacheKey(origin, destination, departureTime) {
        const originPos = normalizeLatLng(origin);
        const destPos = normalizeLatLng(destination);
        return `${originPos.lat},${originPos.lng}:${destPos.lat},${destPos.lng}:${departureTime}`;
    }

    async function fetchRoute(origin, destination, selectedOffset, map) {
        setIsLoadingRoute(true);
        const base = import.meta.env.VITE_API_URL;
        const departureDate = new Date(Date.now() + selectedOffset * 60000);
        const departureTime = departureDate.toISOString();
        const cacheKey = buildRouteCacheKey(origin, destination, departureTime);
        if (lastRouteSelectionRef.current === cacheKey && routeInfo) {
            setIsLoadingRoute(false);
            return;
        }

        try {
            const cached = routeCacheRef.current.get(cacheKey);
            let routeData = cached;
            const originPos = normalizeLatLng(origin);
            const destPos = normalizeLatLng(destination);

            if (!routeData) {
                activeRouteRequestRef.current?.abort?.();
                const controller = new AbortController();
                activeRouteRequestRef.current = controller;

                const response = await axios.post(`${base}/api/map/compute-route/`, {
                    origin: { latitude: originPos.lat, longitude: originPos.lng },
                    destination: { latitude: destPos.lat, longitude: destPos.lng },
                    startTimes: [departureTime], // Send as array with single time
                }, {
                    signal: controller.signal,
                });

                console.log("Route response:", response.data);

                if (response.data && response.data.length > 0) {
                    routeData = response.data[0];
                    routeCacheRef.current.set(cacheKey, routeData);
                }
            }

            if (routeData) {
                const polyline = await drawPolyLine(map, routeData.polyline);

                // Update polylines state via callback to get current value
                setMapPolylines(currentPolylines => {
                    return [...currentPolylines, polyline];
                });

                const distanceKm = formatDistance(routeData.distance_meters);
                const durationInfo = formatDurationInfo(routeData.duration);
                const eta = durationInfo.text;
                const baseDeparture = departureTime;
                const starting_time = formatDate(baseDeparture);
                const arrival_time = formatEtaTimeByMinutes(baseDeparture, durationInfo.totalMinutes);

                setRouteInfo({
                    distanceKm,
                    eta,
                    starting_time,
                    arrival_time,
                    distance_meters: routeData.distance_meters,
                    duration: routeData.duration
                });
                lastRouteSelectionRef.current = cacheKey;
            }
        } catch (error) {
            if (error?.name !== "CanceledError" && error?.code !== "ERR_CANCELED") {
                console.error("Error fetching route:", error);
            }
            setRouteInfo(null);
            if (error.response && error.response.status === 502) {
                setShowErrorPopup(true);
            }
        } finally {
            setIsLoadingRoute(false);
        }
    }

    async function drawPolyLine(map, encodedPolyline) {
        const maps = await google.maps.importLibrary("geometry");
        const decodedPath = google.maps.geometry.encoding.decodePath(encodedPolyline);

        const polyline = new google.maps.Polyline({
            path: decodedPath,
            geodesic: true,
            strokeColor: "#2563eb",
            strokeOpacity: 0.9,
            strokeWeight: 5,
            map,
        });

        return polyline; // Return the polyline so it can be stored
    }

    function generateStartTimes() {
        const times = [];
        const now = new Date();
        const intervalMinutes = 5; // Generate time every 5 minutes
        const totalSlots = 24; // Show next 2 hours (24 * 5min = 120min)

        for (let i = 0; i < totalSlots; i++) {
            const offsetMinutes = i === 0 ? 1 : i * intervalMinutes; // Start from 1 minute
            const futureTime = new Date(now.getTime() + offsetMinutes * 60000);

            const hours = futureTime.getHours();
            const minutes = futureTime.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;

            times.push({
                label: i === 0 ? 'Now' : `+${offsetMinutes} min`,
                displayTime: `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`,
                offsetMinutes: offsetMinutes
            });
        }
        return times;
    }

    function parseDurationSeconds(durationSeconds) {
        let duration = durationSeconds;
        if (typeof duration === "string") {
            duration = duration.replace("s", "");
        }
        duration = Number(duration);
        return Number.isFinite(duration) ? duration : null;
    }

    function formatDurationInfo(durationSeconds) {
        const duration = parseDurationSeconds(durationSeconds);
        if (duration === null) {
            return { text: "N/A", totalMinutes: null };
        }
        const totalMinutes = Math.max(0, Math.round(duration / 60));
        const hrs = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const text = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
        return { text, totalMinutes };
    }

    function formatDistance(meters) {
        if (!meters || isNaN(meters)) return "N/A";
        return (meters / 1000).toFixed(1);
    }

    function parseDepartureDate(value) {
        if (!value) return null;
        if (value instanceof Date) {
            return Number.isNaN(value.getTime()) ? null : value;
        }
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) return parsed;

        const text = String(value).trim();
        const match = text.match(/^(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
        if (!match) return null;

        let hours = Number(match[1]);
        const minutes = Number(match[2]);
        const ampm = match[3]?.toUpperCase();
        if (ampm) {
            if (ampm === "PM" && hours < 12) hours += 12;
            if (ampm === "AM" && hours === 12) hours = 0;
        }
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    }

    function formatDate(dateString) {
        const date = parseDepartureDate(dateString);
        if (!date) return "N/A";
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function formatEtaTimeByMinutes(departureTime, totalMinutes) {
        const departure = parseDepartureDate(departureTime);
        if (!departure || !Number.isFinite(totalMinutes)) return "N/A";
        const arrival = new Date(departure.getTime() + totalMinutes * 60000);
        return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!mapReady || !map) return;

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
    }, [createIncidentPinContent, mapReady, reports]);

    useEffect(() => {
        if (!selectedReport) return;
        if (!reports.some((r) => r.id === selectedReport.id)) {
            setSelectedReport(null);
        }
    }, [reports, selectedReport]);


    function liveNavigateToDestination(){
        console.log("Starting live navigation animation...");
        const totalTime = 1500;

        const lastPolyline = mapPolylines[mapPolylines.length - 1]
        const navigationPathway = lastPolyline.getPath().getArray();
        console.log(lastPolyline)
        console.log("Most recent polyline:", navigationPathway);
        let navigationIndex = 0;

        let startPoint = mapMarkers.origin?.position;
        let endPoint = mapMarkers.destination?.position;

        // Align with the current direction
        let currentPoint = lastPolyline[navigationIndex];
        let nextPoint = lastPolyline[navigationIndex + 1];

        const heading = google.maps.geometry.spherical.computeHeading(
            new google.maps.LatLng(currentPoint),
            new google.maps.LatLng(nextPoint)
        );
        const map = mapRef || mapInstanceRef.current;

        // google maps camera options (for navigation mode)
        const cameraOptions = {
            tilt: map.getTilt(),
            heading: map.getHeading(),
            zoom: map.getZoom(),
            center: new google.maps.LatLng(startPoint),
        };

        const tween = new Tween(cameraOptions) // Create a new tween that modifies 'cameraOptions'.
            .to({ tilt: 20, heading: heading, zoom: 18, center: new google.maps.LatLng(startPoint) }, totalTime) // Move to destination in 15 second.
            .easing(Easing.Quadratic.Out) // Use an easing function to make the animation smooth.
            .onUpdate(() => {map.moveCamera(cameraOptions);
            })
        .start(); // Start the tween immediately.
        
        let culTime = 0;
        // Stops all functionality until animation completes
        function animate(time) {
            tween.update(time)
            culTime += time;

            if (culTime < totalTime)
            {
                return;
            }

            requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
    }

    return (
        <div className="map-page-container">
            <div className="map-wrapper">
                <MapComponent
                    API_KEY={mapData?.GMAPS_KEY}
                    MAP_ID={mapData?.GMAPS_ID}
                    map_function={setMarker}
                    showUserLocation
                    toggleSelectionType={isAToBRef}
                    currentLocation={prevLocationRef}
                    onUserLocation={setUserLocation}
                />
            </div>

            {/* Incident details panel (same UI as Report tab) */}
            <div className={`map-incident-panel ${selectedReport ? "map-incident-panel-active" : "map-incident-panel-inactive"}`}>
                <div className="map-incident-panel-content">
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

            {/* Selection mode toggle button */}
            <div className="origin-toggle" style={{ pointerEvents: "auto" }}>
                <div className="origin-toggle-container">
                    {/* Change to be usestate blah blah blah */}
                    <div className={`origin-toggle-slider ${isAToBState ? "left" : "right"}`} />

                    <div className="origin-toggle-options">
                    <button
                        className={`origin-toggle-option ${isAToBState ? "active" : ""}`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsAToBState(true);
                        }}
                    >
                        A to B
                    </button>

                    <button
                        className={`origin-toggle-option ${!isAToBState ? "active" : ""}`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsAToBState(false);
                        }}
                    >
                        Current location
                    </button>
                    </div>
                </div>
            </div>

            {/* Time Selector - Scrollable Picker */}
            {showTimeSelector && (
                <div className="time-picker-container">
                    <div className="time-picker-card">
                        <div className="time-picker-header">
                            <h3 className="time-picker-title">
                                Select Departure Time
                            </h3>
                            <p className="time-picker-subtitle">
                                Choose when you want to start your trip
                            </p>
                        </div>

                        <div className="time-picker-list custom-scrollbar">
                            {availableTimes.map((timeSlot, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleTimeChange(index)}
                                    disabled={isLoadingRoute}
                                    className={`time-slot-button ${selectedOffsetMinutes === timeSlot.offsetMinutes ? 'selected' : ''}`}
                                >
                                    <div className="time-slot-info">
                                        <div className="time-slot-display-time">
                                            {timeSlot.displayTime}
                                        </div>
                                        <div className="time-slot-label">
                                            {timeSlot.label}
                                        </div>
                                    </div>
                                    {selectedOffsetMinutes === timeSlot.offsetMinutes && (
                                        <div className="time-slot-checkmark">
                                            <span style={{ fontSize: '14px' }}>✓</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modern Route Info Card */}
            {routeInfo && (
                <div className="route-info-container">
                    <div className="route-info-card">
                        <div className="route-info-gradient-bar" />

                        {isLoadingRoute && (
                            <div className="route-info-loading">
                                <div className="route-info-spinner" />
                            </div>
                        )}

                        <h3 className="route-info-title">
                            Route Information
                        </h3>

                        <div className="route-info-items">
                            {/* Distance */}
                            <div className="route-info-item">
                                <div className="route-info-icon distance">
                                    <span>📍</span>
                                </div>
                                <div>
                                    <div className="route-info-label">Distance</div>
                                    <div className="route-info-value">
                                        {routeInfo.distanceKm} <span className="route-info-unit">km</span>
                                    </div>
                                </div>
                            </div>

                            {/* Departure Time */}
                            <div className="route-info-item">
                                <div className="route-info-icon departure">
                                    <span>🚗</span>
                                </div>
                                <div>
                                    <div className="route-info-label">Departure</div>
                                    <div className="route-info-value">{routeInfo.starting_time}</div>
                                </div>
                            </div>

                            {/* ETA */}
                            <div className="route-info-item">
                                <div className="route-info-icon duration">
                                    <span>🕒</span>
                                </div>
                                <div>
                                    <div className="route-info-label">ETA</div>
                                    <div className="route-info-value">{routeInfo.arrival_time ?? "N/A"}</div>
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="route-info-item">
                                <div className="route-info-icon duration">
                                    <span>⏱️</span>
                                </div>
                                <div>
                                    <div className="route-info-label">Travel Time</div>
                                    <div className="route-info-value">{routeInfo.eta}</div>
                                </div>
                            </div>

                            {/* Directions */}
                            <button className="route-info-directions-item" onClick={liveNavigateToDestination}>
                                <div className="route-info-icon">
                                    <span>🗺️</span>
                                </div>
                                <div>
                                    <div className="route-info-value">Directions {"->"}</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Map Button */}
            <div className="clear-button-container">
                <button
                    onClick={clearMap}
                    className="clear-button"
                    title="Clear all pins and routes"
                >
                    <X size={24} color="#dc2626" />
                </button>
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
                            }}>{username || "Guest"}</p>
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
                                onClick={() => {
                                    setShowDropdown(false);
                                    setShowLogoutConfirm(true);
                                }}
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

            {/* Testing button to check if distance and points gets updated correctly */}
            {/* <button
                style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999 }}
                onClick={async () => {
                    const distance = 1000; // meters
                    setCumulativeDistance((prev) => prev + distance);

                    if (isAuthenticated()) {
                    try {
                        const res = await apiPost("/user/distance/", { distance_m: distance });
                        console.log("Backend updated:", res);
                    } catch (e) {
                        console.error("Backend update failed:", e);
                    }
                    }
                }}
                >
                Simulate +1km
            </button> */}


            {/* Error Popup */}
            {showErrorPopup && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        width: '90%',
                        maxWidth: '400px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        textAlign: 'center',
                        position: 'relative',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <button
                            onClick={() => setShowErrorPopup(false)}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={20} color="#9ca3af" />
                        </button>

                        <div style={{
                            width: '48px',
                            height: '48px',
                            backgroundColor: '#fef2f2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px auto'
                        }}>
                            <AlertTriangle size={24} color="#dc2626" />
                        </div>

                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#111827',
                            marginBottom: '8px',
                            marginTop: 0
                        }}>
                            Server Error
                        </h3>

                        <p style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            marginBottom: '24px',
                            lineHeight: '1.5'
                        }}>
                            We encountered a 502 Bad Gateway error. The server is currently unavailable. Please try again later.
                        </p>

                        <button
                            onClick={() => setShowErrorPopup(false)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontWeight: '500',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Click outside to close dropdown */}
            {
                showDropdown && (
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
            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="logout-modal">
                    <div className="logout-box">
                        <h3>Confirm Logout</h3>
                        <p>Are you sure you want to log out?</p>
                        <button onClick={() => setShowLogoutConfirm(false)}>Cancel</button>
                        <button onClick={handleLogout}>Log Out</button>
                    </div>
                </div>
            )}


        </div>
    );
}
