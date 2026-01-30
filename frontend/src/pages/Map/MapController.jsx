import { Component } from "react";
import axios from "axios";
import { fetchRewardAccount, clearAuth, isAuthenticated, apiPost, apiGet, apiDelete, getAccessToken } from "../../lib/api";
import { Easing, Tween } from "@tweenjs/tween.js";
import { NativeGeolocationProvider, WebGeolocationProvider } from "../../lib/geolocationFiles.js";
import MapView from "./MapView";
import { RoutePreferencesContext } from "@/components/RoutePreferencesContext";
import { fetchMapConfig } from "../../lib/mapConfig";
import { BACKEND_API_URL } from "../../lib/constants.js";


export default class MapController extends Component {
    static contextType = RoutePreferencesContext;

    constructor(props) {
        super(props);
        this.state = {
            mapData: null,
            showDropdown: false,
            points: 0,
            username: "",
            routeInfo: null,
            mapMarkers: { origin: null, destination: null },
            hasOrigin: false,
            hasDestination: false,
            mapPolylines: [],
            availableTimes: [],
            selectedOffsetMinutes: 1,
            showTimeSelector: false,
            showRouteOptions: false,
            isLoadingRoute: false,
            mapRef: null,
            errorPopup: null,
            showLogoutConfirm: false,
            cumulativeDistance: 0,
            isMobileDevice: false,
            selectedReport: null,
            reports: [],
            userLocation: null,
            mapReady: false,
            isAToBState: true,
            showNavigationScreen: false,
            showAll: true,
            navigationIndex: 0,
            isNavigationBegun: false,
            showNavigationEndScreen: false,
            speedKmh: 0,
            rawSpeedKmh: 0,
            etaRemainingText: null,
            etaRemainingMinutes: null,
            chosenRouteState: null,
            showSaveMenu: false,
            showSavedDestinations: false,
            savedDestinations: [],
            isLoadingSavedDestinations: false,
            deletingDestinationId: null,
            savePlaceModalOpen: false,
            savePlaceType: "",
            savePlaceLabel: "",
            savePlaceMarker: null,
            savePlaceError: "",
            isSavingPlace: false,
        };
        this.prevtoll = null,
        this.mockLocation = {
            latitude: -37.8124,
            longitude: 144.9623,
        }
        this.lastRouteSelectionRef = null;
        this.prevLocationRef = { current: null };
        this.locationPollingData = { current: null };
        this.lastUpdateTimeRef = 0;
        this.routeCacheRef = new globalThis.Map();
        this.activeRouteRequestRef = null;
        this.mapReadyRef = false;
        this.mapInstanceRef = null;
        this.reportMarkersRef = new globalThis.Map();
        this.trafficLayerRef = null;
        this.isAToBRef = { current: true };
        this.isMountedRef = false;

        this.speedEmaRef = 0;
        this.totalMoveTimeSecRef = 0;
        this.totalMoveDistMRef = 0;

        this.lastEtaOriginRef = null;
        this.activeEtaRequestRef = null;
        this.lastEtaUpdateMsRef = 0;

        this.reportTypeLabel = {
            ACCIDENT: "Accident",
            HAZARD: "Hazard",
            WEATHER: "Weather",
            CRIME: "Crime",
            OTHER: "Other",
        };

        this.reportTypeTheme = {
            ACCIDENT: { badgeText: "#991B1B", border: "#FCA5A5" },
            HAZARD: { badgeText: "#9A3412", border: "#FDBA74" },
            WEATHER: { badgeText: "#1D4ED8", border: "#93C5FD" },
            CRIME: { badgeText: "#5B21B6", border: "#C4B5FD" },
            OTHER: { badgeText: "#111827", border: "#D1D5DB" },
        };

        const svgBase = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
        this.reportTypeIconSvg = {
            ACCIDENT: `<svg viewBox="0 0 24 24" width="30" height="30" ${svgBase}> <!-- Left car --> <path d="M3 13h7l1.5-2.5a2 2 0 0 1 1.7-1h1.8"/> <path d="M4 13l-1 2"/> <path d="M9 13l1 2"/> <circle cx="5" cy="17" r="1"/> <circle cx="9" cy="17" r="1"/> <!-- Right car --> <path d="M21 13h-7l-1.5-2.5a2 2 0 0 0-1.7-1H9.5"/> <path d="M20 13l1 2"/> <path d="M15 13l-1 2"/> <circle cx="15" cy="17" r="1"/> <circle cx="19" cy="17" r="1"/> <!-- Impact --> <path d="M11.2 11.8l.8-.8l.8.8"/> <path d="M12 10v-1"/> <path d="M10.8 10.8l-.8-.8"/> <path d="M13.2 10.8l.8-.8"/> </svg>`,
            HAZARD: `<svg viewBox="0 0 24 24" width="22" height="22" ${svgBase}><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z"/></svg>`,
            WEATHER: `<svg viewBox="0 0 24 24" width="22" height="22" ${svgBase}><path d="M17.5 19a4.5 4.5 0 0 0-.9-8.9A6 6 0 0 0 5 12.2 3.8 3.8 0 0 0 5.5 20H17.5Z"/></svg>`,
            CRIME: `<svg viewBox="0 0 24 24" width="22" height="22" ${svgBase}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>`,
            OTHER: `<svg viewBox="0 0 24 24" width="22" height="22" ${svgBase}><path d="M12 12h.01"/><path d="M19 12h.01"/><path d="M5 12h.01"/></svg>`,
        };

        this.timeSelectorIntervalId = null;
        this.etaIntervalId = null;
        this.reportsIntervalId = null;
        this.timeSelectorRunId = 0;
        this.etaRefreshRunId = 0;
        this.reportMarkersRunId = 0;
        this.searchMarkerRef = null;
    }

    componentDidMount() {
        const isNativeApp = /Mobi|Android/i.test(navigator.userAgent);
        this.setState({ isMobileDevice: isNativeApp });
        console.log("isNativeApp", isNativeApp);

        fetchMapConfig()
            .then((data) => this.setState({ mapData: data }))
            .catch(() => this.setState({ mapData: null }));

        this.loadUserData();
        this.startReportsPolling();
        this.startLocationPolling();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.isMobileDevice !== this.state.isMobileDevice || prevState.mapData !== this.state.mapData) {
            this.startLocationPolling();
        }
        if (
            prevState.isNavigationBegun !== this.state.isNavigationBegun ||
            prevState.mapMarkers.destination !== this.state.mapMarkers.destination
        ) {
            this.startEtaRefresh();
        }

        if (
            prevState.showTimeSelector !== this.state.showTimeSelector ||
            prevState.selectedOffsetMinutes !== this.state.selectedOffsetMinutes
        ) {
            this.updateTimeSelector();
        }

        if (this.prevToll !== this.context.isTollRoadsOn && this.context.isTollRoadsOn !== undefined) {
            this.prevToll = this.context.isTollRoadsOn;
            this.handleTollRouteChange();
        }

        if (prevState.isAToBState !== this.state.isAToBState) {
            this.isAToBRef.current = this.state.isAToBState;
            this.clearMap();
        }

        if (prevState.mapReady !== this.state.mapReady || prevState.reports !== this.state.reports) {
            this.syncReportMarkers();
        }

        if (prevState.reports !== this.state.reports || prevState.selectedReport !== this.state.selectedReport) {
            if (this.state.selectedReport && !this.state.reports.some((r) => r.id === this.state.selectedReport.id)) {
                this.setSelectedReport(null);
            }
        }

        if (prevState.prevLocationRef?.current !== this.state.prevLocationRef?.current ||
            prevState.reports !== this.state.reports ||
            prevState.selectedReport !== this.state.selectedReport) {
            this.proximityReports();
        }


        if (this.state.isNavigationBegun == true && 
            (prevState.prevLocationRef?.current !== this.state.prevLocationRef?.current ||
            prevState.navigationIndex !== this.state.navigationIndex ||
            prevState.mapPolylines !== this.state.mapPolylines ||
            prevState.routeInfo !== this.state.routeInfo)
        ) {
            this.handleNavigationProgress();
        }
    }

    componentWillUnmount() {
        if (this.reportsIntervalId) {
            clearInterval(this.reportsIntervalId);
            this.reportsIntervalId = null;
        }
        window.removeEventListener("rp:auth-changed", this.handleAuthChanged);

        if (this.timeSelectorIntervalId) {
            clearInterval(this.timeSelectorIntervalId);
            this.timeSelectorIntervalId = null;
        }

        if (this.etaIntervalId) {
            clearInterval(this.etaIntervalId);
            this.etaIntervalId = null;
        }

        this.activeEtaRequestRef?.abort?.();
        this.etaRefreshRunId += 1;
        this.timeSelectorRunId += 1;
        this.reportMarkersRunId += 1;
    }


    proximityReports() {

        if (!this.state.prevLocationRef?.current || this.state.reports.length === 0) return;

        const userLat = this.state.prevLocationRef.current.latitude;
        const userLng = this.state.prevLocationRef.current.longitude;
        const userLatLng = new google.maps.LatLng(userLat, userLng);

        let closestReport = null;
        let minDistance = Infinity;

        // Find closest report within 150m
        for (const report of this.state.reports) {
            const reportLatLng = new google.maps.LatLng(report.latitude, report.longitude);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, reportLatLng);

            if (distance <= 150 && distance < minDistance) {
                minDistance = distance;
                closestReport = report;
            }
        }

        // Show popup if within 150m
        if (closestReport) {
            if (!this.state.selectedReport || this.state.selectedReport.id !== this.state.closestReport.id) {
                setSelectedReport(closestReport);
            }
        } else if (this.state.selectedReport) {
            // Check if user moved away from the currently selected report (beyond 151m)
            const selectedLatLng = new google.maps.LatLng(this.state.selectedReport.latitude, this.state.selectedReport.longitude);
            const distanceToSelected = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, selectedLatLng);

            if (distanceToSelected > 151) {
                setSelectedReport(null);
            }
        }
    };


    loadUserData = async () => {
        if (!isAuthenticated()) {
            return;
        }

        try {
            const data = await fetchRewardAccount();
            this.setState({ points: data.reward_points, username: data.username });
        } catch (err) {
            console.error("Failed to fetch user data:", err);
            if (err.message.includes("Authentication failed")) {
                clearAuth();
            }
        }
    };

    handleAuthChanged = () => {
        this.fetchReports();
    };

    fetchReports = () => {
        const base = import.meta.env.VITE_API_URL || BACKEND_API_URL;
        return axios
            .get(`${base}/api/incident-reports/`, { timeout: 10000 })
            .then((r) => {
                const nextReports = (Array.isArray(r.data) ? r.data : []).filter((x) => x?.is_active !== false);
                this.setState({ reports: nextReports });
            })
            .catch((err) => { console.error("Fetch reports failed:", err); });
    };

    startReportsPolling = () => {
        this.fetchReports();
        this.reportsIntervalId = setInterval(this.fetchReports, 15000);
        window.addEventListener("rp:auth-changed", this.handleAuthChanged);
    };

    startLocationPolling = () => {
        const base = import.meta.env.VITE_API_URL || BACKEND_API_URL;
        axios.get(`${base}/api/map/location/`).then((r) => {
            this.isMountedRef = true;
            let provider = null;
            if (!this.state.mapData?.GMAPS_KEY || !this.state.mapData?.GMAPS_ID) return () => { this.isMountedRef = false; };

            if (navigator?.geolocation && this.isMountedRef) {
                this.locationPollingData.current = r.data;
                console.log("Location Polling Data Ref:", this.locationPollingData);

                provider = this.state.isMobileDevice
                    ? new NativeGeolocationProvider()
                    : new WebGeolocationProvider();

                console.log("provider", provider);
                provider?.start(this.prevLocationRef, this.locationPollingData, this.onLocationUpdate);
            }

            return () => {
                this.isMountedRef = false;
                provider?.stop();
            };
        });
    };

    onLocationUpdate = (newLocation, now) => {
        console.log("Location update received:", newLocation);
        const prev = this.prevLocationRef.current;
        let distance = 0;

        const hasGeometry = !!(globalThis.google?.maps?.geometry?.spherical);
        if (prev && hasGeometry) {
            distance = google.maps.geometry.spherical.computeDistanceBetween(
                new google.maps.LatLng(prev.latitude, prev.longitude),
                new google.maps.LatLng(newLocation.latitude, newLocation.longitude)
            );
        }

        console.log(
            "Δlat", prev ? newLocation.latitude - prev.latitude : 0,
            "Δlng", prev ? newLocation.longitude - prev.longitude : 0
        );

        if (!hasGeometry && prev) {
            const toRad = (v) => (v * Math.PI) / 180;
            const R = 6371000;
            const dLat = toRad(newLocation.latitude - prev.latitude);
            const dLng = toRad(newLocation.longitude - prev.longitude);

            const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(prev.latitude)) *
                    Math.cos(toRad(newLocation.latitude)) *
                    Math.sin(dLng / 2) ** 2;

            distance = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        // update "previous" immediately
        this.prevLocationRef.current = newLocation;

        // time delta (seconds)
        const lastT = this.lastUpdateTimeRef?.current ?? now;
        const dtSec = Math.max(0.001, (now - lastT) / 1000);

        // filter jitter + jumps
        const MIN_MOVE_M = 1;
        const MAX_MOVE_M = 150;
        // const MAX_SPEED_KMH = 200; // ignore unrealistic spikes

        if (distance >= MIN_MOVE_M && distance <= MAX_MOVE_M) {
            this.setState((prevState) => ({ cumulativeDistance: prevState.cumulativeDistance + distance }));

            // this.totalMoveDistMRef += distance;
            // this.totalMoveTimeSecRef += dtSec;

            // Instant speed
            const speedKmh = (distance / dtSec) * 3.6;

            if (isAuthenticated()) {
                apiPost("/user/distance/", { distance_m: distance }).catch((err) =>
                    console.error("Failed to persist distance:", err)
                );
            }

            if (Number.isFinite(speedKmh) && speedKmh <= MAX_SPEED_KMH) {
                // Smooth with EMA for stable UI
                const alpha = 0.25;
                this.speedEmaRef =
                    this.speedEmaRef != null
                        ? alpha * speedKmh + (1 - alpha) * this.speedEmaRef
                        : speedKmh;

                this.setState({ speedKmh: this.speedEmaRef });
            }
        } else {
            const decay = 0.85;
            this.speedEmaRef *= decay;
            this.setState({ speedKmh: this.speedEmaRef });

            // if (this.speedEmaRef < 0.5) {
            //     this.speedEmaRef = 0;
            //     this.setState({ speedKmh: 0 });
            // }
        }

        this.lastUpdateTimeRef = now;
        console.log("Distance moved (m):", this.state.cumulativeDistance);
        console.log("Location updated:", newLocation);
    };

    startEtaRefresh = () => {
        if (this.etaIntervalId) {
            clearInterval(this.etaIntervalId);
            this.etaIntervalId = null;
        }
        this.activeEtaRequestRef?.abort?.();
        this.etaRefreshRunId += 1;

        if (!this.state.isNavigationBegun) {
            return;
        }

        const runId = this.etaRefreshRunId;

        const refreshLiveEta = async () => {
            if (runId !== this.etaRefreshRunId) return;

            const cur = this.prevLocationRef.current;
            const destMarker = this.state.mapMarkers?.destination;

            if (!cur || !destMarker) return;

            const dest = this.normalizeLatLng(destMarker.position);

            const MIN_MOVE_FOR_REFRESH_M = 30;
            const nowMs = Date.now();

            if (this.lastEtaOriginRef) {
                const movedM = google.maps.geometry.spherical.computeDistanceBetween(
                    new google.maps.LatLng(
                        this.lastEtaOriginRef.latitude,
                        this.lastEtaOriginRef.longitude
                    ),
                    new google.maps.LatLng(cur.latitude, cur.longitude)
                );

                const timeSince = nowMs - (this.lastEtaUpdateMsRef || 0);

                if (movedM < MIN_MOVE_FOR_REFRESH_M && timeSince < 15000) {
                    return;
                }
            }

            // abort previous ETA request
            this.activeEtaRequestRef?.abort?.();
            const controller = new AbortController();
            this.activeEtaRequestRef = controller;

            try {
                const base = import.meta.env.VITE_API_URL || BACKEND_API_URL;
                const departureTime = this.getDepartureTimeISO(0);

                const res = await axios.post(
                    `${base}/api/map/compute-route/`,
                    {
                        origin: {
                            latitude: cur.latitude,
                            longitude: cur.longitude,
                        },
                        destination: {
                            latitude: dest.lat,
                            longitude: dest.lng,
                        },
                        startTimes: [departureTime],
                    },
                    { signal: controller.signal }
                );

                const route = res.data?.[0];
                if (!route) return;

                const durationInfo = this.formatDurationInfo(route.duration);
                this.setState({ etaRemainingText: durationInfo.text });

                this.lastEtaOriginRef = {
                    latitude: cur.latitude,
                    longitude: cur.longitude,
                };
                this.lastEtaUpdateMsRef = nowMs;
            } catch (err) {
                if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
                console.error("[ETA] Live ETA refresh failed:", err);
            }
        };

        refreshLiveEta();

        this.etaIntervalId = setInterval(refreshLiveEta, 15000);
    };

    updateTimeSelector = () => {
        if (this.timeSelectorIntervalId) {
            clearInterval(this.timeSelectorIntervalId);
            this.timeSelectorIntervalId = null;
        }

        if (!this.state.showTimeSelector) return;

        this.timeSelectorRunId += 1;
        const runId = this.timeSelectorRunId;

        const refreshTimes = () => {
            if (runId !== this.timeSelectorRunId) return;
            const times = this.generateStartTimes();
            this.setState({ availableTimes: times });
            if (!this.state.selectedOffsetMinutes) {
                this.setState({ selectedOffsetMinutes: times[0]?.offsetMinutes ?? 1 });
            }
        };

        refreshTimes();
        this.timeSelectorIntervalId = setInterval(refreshTimes, 30000);
    };

    createIncidentPinContent = (reportType) => {
        const theme = this.reportTypeTheme[reportType] || this.reportTypeTheme.OTHER;
        const icon = this.reportTypeIconSvg[reportType] || this.reportTypeIconSvg.OTHER;

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
    };

    handleRewardsClick = () => {
        this.setState({ showDropdown: false });
        this.props.navigate("/rewards-page");
    };

    handleSettingsClick = () => {
        this.setState({ showDropdown: false });
        this.props.navigate("/setting-menu-page");
    };

    handleLogout = () => {
        clearAuth();
        this.setState({ showLogoutConfirm: false });
        this.props.navigate("/", { replace: true });
    };

    clearMap = () => {
        const { mapMarkers, mapPolylines } = this.state;
        if (mapMarkers.origin) mapMarkers.origin.map = null;
        if (mapMarkers.destination) mapMarkers.destination.map = null;
        if (this.searchMarkerRef) {
            this.searchMarkerRef.setMap(null);
            this.searchMarkerRef = null;
        }

        mapPolylines.forEach((polyline) => polyline.setMap(null));

        this.setState({
            mapMarkers: { origin: null, destination: null },
            mapPolylines: [],
            routeInfo: null,
            showTimeSelector: false,
            showRouteOptions: false,
            availableTimes: [],
            selectedOffsetMinutes: 1,
            showSaveMenu: false,
            showSavedDestinations: false,
        });
    };

    handlePlaceSelected = async (place) => {
        const map = this.state.mapRef || this.mapInstanceRef;
        const location = place?.geometry?.location;
        if (!map || !location) return;
        if (this.state.showNavigationScreen || this.state.isNavigationBegun) return;

        const coords = this.normalizeLatLng(location);
        if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return;

        map.panTo(coords);
        map.setZoom(15);

        const g = window.google;
        if (!g?.maps?.importLibrary) return;
        const { AdvancedMarkerElement } = await g.maps.importLibrary("marker");

        if (this.searchMarkerRef) {
            this.searchMarkerRef.setMap(null);
            this.searchMarkerRef = null;
        }

        let originMarker = this.state.mapMarkers.origin;
        let destinationMarker = this.state.mapMarkers.destination;

        const currentPos = this.getCurrentUserLatLng();

        if (!originMarker) {
            if (currentPos) {
                originMarker = new AdvancedMarkerElement({
                    map,
                    position: currentPos,
                    title: "A",
                });
            } else {
                originMarker = new AdvancedMarkerElement({
                    map,
                    position: coords,
                    title: "A",
                });
                this.setState({
                    mapMarkers: { origin: originMarker, destination: null },
                    routeInfo: null,
                    showRouteOptions: false,
                    availableTimes: [],
                    selectedOffsetMinutes: 1,
                    hasOrigin: true,
                    hasDestination: false,
                });
                return;
            }
        } else if (!originMarker.map) {
            originMarker.map = map;
        }

        if (destinationMarker) {
            destinationMarker.map = null;
        }
        destinationMarker = new AdvancedMarkerElement({
            map,
            position: coords,
            title: "B",
        });

        this.state.mapPolylines.forEach((polyline) => polyline.setMap(null));
        const times = this.generateStartTimes();
        const selectedOffset = times[0]?.offsetMinutes ?? 1;

        this.setState({
            mapMarkers: { origin: originMarker, destination: destinationMarker },
            mapPolylines: [],
            routeInfo: null,
            availableTimes: times,
            selectedOffsetMinutes: selectedOffset,
            showRouteOptions: true,
            hasOrigin: true,
            hasDestination: true,
        });

        this.fetchRoute(originMarker.position, destinationMarker.position, selectedOffset, map);
    };

    setMarker = async (map) => {
        if (this.mapReadyRef) return;
        this.mapReadyRef = true;
        this.mapInstanceRef = map;
        this.setState({ mapReady: true, mapRef: map });

        let originMarker = this.state.mapMarkers.origin;
        let destinationMarker = this.state.mapMarkers.destination;

        const g = window.google;
        if (!g?.maps?.importLibrary) return;
        const { AdvancedMarkerElement } = await g.maps.importLibrary("marker");

        if (!this.trafficLayerRef) {
            this.trafficLayerRef = new g.maps.TrafficLayer();
            this.trafficLayerRef.setMap(map);
        }

        map.addListener("click", () => {
            this.setSelectedReport(null);
        });

        map.addListener("click", (e) => {
            const { showNavigationScreen, isNavigationBegun } = this.state;
            if (showNavigationScreen || isNavigationBegun) { return; }

            const clicked = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            console.log(this.isAToBRef.current, "isAToB");
            const currentPos = this.getCurrentUserLatLng();
            console.log("currentlocation ", currentPos);

            originMarker = this.state.mapMarkers.origin;
            destinationMarker = this.state.mapMarkers.destination;

            if (!this.isAToBRef.current && currentPos) {
                console.log("Setting origin to user location:", currentPos);
                originMarker = new AdvancedMarkerElement({
                    map: map,
                    position: currentPos,
                    title: "A",
                });
                this.setState({
                    mapMarkers: { origin: originMarker, destination: null },
                    hasOrigin: true,
                });
            }

            if (!originMarker) {
                originMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title: "A",
                });
                this.setState({
                    mapMarkers: { origin: originMarker, destination: null },
                    hasOrigin: true,
                });
            } else if (!destinationMarker) {
                destinationMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title: "B",
                });
                const times = this.generateStartTimes();
                this.setState({
                    mapMarkers: { origin: originMarker, destination: destinationMarker },
                    showSaveMenu: false,
                    availableTimes: times,
                    selectedOffsetMinutes: times[0]?.offsetMinutes ?? 1,
                    showRouteOptions: true,
                    hasOrigin: true,
                    hasDestination: true,
                },
                    () => {
                        console.log("After destination set:", this.state.mapMarkers);
                    }
                );

                this.fetchRoute(originMarker.position, destinationMarker.position, times[0].offsetMinutes, map);
            } else {
                originMarker.map = null;
                destinationMarker.map = null;

                this.state.mapPolylines.forEach((polyline) => polyline.setMap(null));

                this.setState({
                    mapPolylines: [],
                    routeInfo: null,
                    showRouteOptions: false,
                    availableTimes: [],
                    selectedOffsetMinutes: 1,
                    showSaveMenu: false,
                });

                if (!this.isAToBRef.current) {
                    const curPos = this.getCurrentUserLatLng();
                    if (curPos) {
                        console.log("Setting origin to user location:", curPos);
                        originMarker = new AdvancedMarkerElement({
                            map: map,
                            position: curPos,
                            title: "A",
                        });
                    } else {
                        console.warn("User location not valid yet, cannot set origin to current location.");
                        // Do NOT fall back to manual pin if user explicitly wants 'Current Location' mode
                        // Just return or show toast
                        return;
                    }
                    this.setState({
                        mapMarkers: { origin: originMarker, destination: null },
                        hasOrigin: true,
                    });
                } else {
                    originMarker = new AdvancedMarkerElement({
                        map: map,
                        position: clicked,
                        title: "A",
                    });
                    this.setState({
                        mapMarkers: { origin: originMarker, destination: null },
                        hasOrigin: true,
                    });
                }
            }
            console.log("mapMarkers in state:", this.state.mapMarkers);
        });
    };
    handleTollRouteChange = async () => {
        const map = this.state.mapRef || this.mapInstanceRef;
        const { mapMarkers, isLoadingRoute, selectedOffsetMinutes } = this.state;
        if (!mapMarkers.origin || !mapMarkers.destination || !map) return;
        if (isLoadingRoute) return;

        this.setState({ isLoadingRoute: true });

        this.state.mapPolylines.forEach((polyline) => polyline.setMap(null));
        this.setState({ mapPolylines: [] });

        await this.fetchRoute(mapMarkers.origin.position, mapMarkers.destination.position, selectedOffsetMinutes, map);
    }

    handleTimeChange = async (index) => {
        const map = this.state.mapRef || this.mapInstanceRef;
        const { mapMarkers, availableTimes, isLoadingRoute, selectedOffsetMinutes, routeInfo } = this.state;
        if (!mapMarkers.origin || !mapMarkers.destination || !availableTimes[index] || !map) return;

        const selectedOffset = availableTimes[index].offsetMinutes;
        if (isLoadingRoute) return;
        if (selectedOffsetMinutes === selectedOffset && routeInfo) return;

        this.setState({ isLoadingRoute: true });

        this.state.mapPolylines.forEach((polyline) => polyline.setMap(null));
        this.setState({ mapPolylines: [] });

        await this.fetchRoute(mapMarkers.origin.position, mapMarkers.destination.position, selectedOffset, map);
        this.setState({ selectedOffsetMinutes: selectedOffset });
    };

    normalizeLatLng = (pos) => {
        const lat = typeof pos.lat === "function" ? pos.lat() : pos.lat;
        const lng = typeof pos.lng === "function" ? pos.lng() : pos.lng;
        return { lat, lng };
    };

    extractLatLng = (value) => {
        if (!value) return null;
        const lat = Number(value.latitude ?? value.lat);
        const lng = Number(value.longitude ?? value.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng };
    };

    extractStepTarget = (step) => {
        if (!step) return null;
        return (
            this.extractLatLng(step?.endLocation?.latLng) ||
            this.extractLatLng(step?.startLocation?.latLng) ||
            this.extractLatLng(step?.endLocation) ||
            this.extractLatLng(step?.startLocation) ||
            this.extractLatLng(step?.latLng) ||
            this.extractLatLng(step)
        );
    };

    getNavigationTarget = () => {
        const steps = this.state.routeInfo?.steps;
        const idx = this.state.navigationIndex;
        if (Array.isArray(steps) && steps.length > 0) {
            const currentTarget = this.extractStepTarget(steps[idx]);
            if (currentTarget) return currentTarget;
            const nextTarget = this.extractStepTarget(steps[idx + 1]);
            if (nextTarget) return nextTarget;
        }

        const destMarker = this.state.mapMarkers?.destination;
        if (destMarker?.position) {
            const dest = this.normalizeLatLng(destMarker.position);
            if (Number.isFinite(dest.lat) && Number.isFinite(dest.lng)) return dest;
        }

        return null;
    };

    getCurrentUserLatLng = (fallbackLocation) => {
        const cur = this.prevLocationRef.current;
        const fallback = fallbackLocation ?? this.state?.userLocation;
        const lat = Number(
            cur?.latitude ??
            cur?.lat ??
            fallback?.latitude ??
            fallback?.lat
        );
        const lng = Number(
            cur?.longitude ??
            cur?.lng ??
            fallback?.longitude ??
            fallback?.lng
        );
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng };
    };

    handleRecenterRequest = ({ map, location }) => {
        const mapInstance = map || this.state.mapRef || this.mapInstanceRef;
        if (!mapInstance) return false;

        const curLocation = this.getCurrentUserLatLng(location);
        if (!curLocation) return false;

        const isNavigating = this.state.isNavigationBegun || this.state.showNavigationScreen;

        // In navigation mode, avoid recomputing heading on recenter.
        // Recomputing heading can cause the camera to "turn around"
        // if the inferred next target is behind the user.
        if (isNavigating) {
            const g = globalThis.google?.maps;
            const center = g?.LatLng ? new g.LatLng(curLocation.lat, curLocation.lng) : curLocation;
            const zoom = mapInstance.getZoom?.();
            const heading = mapInstance.getHeading?.();
            const tilt = mapInstance.getTilt?.();
            const nextZoom = Number.isFinite(zoom) ? Math.max(zoom, 18) : 18;
            const nextHeading = Number.isFinite(heading) ? heading : 0;
            const nextTilt = Number.isFinite(tilt) ? tilt : 40;

            if (typeof mapInstance.moveCamera === "function") {
                mapInstance.moveCamera({
                    center,
                    zoom: nextZoom,
                    heading: nextHeading,
                    tilt: nextTilt,
                });
            } else {
                mapInstance.panTo(center);
                if (!Number.isFinite(zoom) || zoom < nextZoom) mapInstance.setZoom(nextZoom);
                if (typeof mapInstance.setHeading === "function") mapInstance.setHeading(nextHeading);
                if (typeof mapInstance.setTilt === "function") mapInstance.setTilt(nextTilt);
            }
            return true;
        }

        mapInstance.panTo(curLocation);
        const zoom = mapInstance.getZoom?.();
        if (!Number.isFinite(zoom) || zoom < 14) {
            mapInstance.setZoom(14);
        }
        return true;
    };

    buildRouteCacheKey = (origin, destination, departureTime) => {
        const originPos = this.normalizeLatLng(origin);
        const destPos = this.normalizeLatLng(destination);
        return `${originPos.lat},${originPos.lng}:${destPos.lat},${destPos.lng}:${departureTime}`;
    };

    getDepartureTimeISO = (offsetMinutes = 0) => {
        const nowMs = Date.now();
        const offsetMs = (Number.isFinite(offsetMinutes) ? offsetMinutes : 0) * 60000;
        const minLeadMs = 60000; // Google Routes rejects past/near-past times; keep at least 1 minute ahead.
        const targetMs = nowMs + offsetMs;
        const safeMs = Math.max(targetMs, nowMs + minLeadMs);
        return new Date(safeMs).toISOString();
    };

    fetchRoute = async (origin, destination, selectedOffset, map) => {
        this.setState({ isLoadingRoute: true });
        const base = import.meta.env.VITE_API_URL || BACKEND_API_URL;
        const departureTime = this.getDepartureTimeISO(selectedOffset);
        const cacheKey = this.buildRouteCacheKey(origin, destination, departureTime);

        if (this.lastRouteSelectionRef === cacheKey && this.state.routeInfo) {
            this.setState({ isLoadingRoute: false });
            return;
        }

        try {
            const cached = this.routeCacheRef.get(cacheKey);
            let routeData = cached;
            const originPos = this.normalizeLatLng(origin);
            const destPos = this.normalizeLatLng(destination);

            if (!routeData) {
                this.activeRouteRequestRef?.abort?.();
                const controller = new AbortController();
                this.activeRouteRequestRef = controller;

                const response = await axios.post(`${base}/api/map/compute-route/`, {
                    origin: { latitude: originPos.lat, longitude: originPos.lng },
                    destination: { latitude: destPos.lat, longitude: destPos.lng },
                    startTimes: [departureTime],
                    avoidTolls: this.context.isTollRoadsOn,
                }, {
                    signal: controller.signal,
                    timeout: 20000,
                });

                console.log("Route response:", response.data);

                if (response.data && response.data.length > 0) {
                    routeData = response.data[0];
                    this.routeCacheRef.set(cacheKey, routeData);
                }
            }

            if (routeData) {
                const polyline = await this.drawPolyLine(map, routeData.polyline);

                this.setState((prevState) => ({ mapPolylines: [...prevState.mapPolylines, polyline] }));

                const distanceKm = this.formatDistance(routeData.distance_meters);
                const durationInfo = this.formatDurationInfo(routeData.duration);
                const eta = durationInfo.text;
                const baseDeparture = departureTime;
                const starting_time = this.formatDate(baseDeparture);
                const arrival_time = this.formatEtaTimeByMinutes(baseDeparture, durationInfo.totalMinutes);
                const steps = this.formatSteps(routeData.legs);
                console.log("Formatted steps:", steps);

                this.setState({
                    routeInfo: {
                        distanceKm,
                        eta,
                        starting_time,
                        arrival_time,
                        distance_meters: routeData.distance_meters,
                        duration: routeData.duration,
                        steps,
                    },
                });
                this.lastRouteSelectionRef = cacheKey;
            }
        } catch (error) {
            if (error?.name && (error.name === "CanceledError" || error.code === "ERR_CANCELED")) {
                return;
            }
            console.error("Error fetching route:", error);
            if (error.response && error.response.data) {
                console.error("Backend Error Details:", error.response.data);
            }

            this.setState({ routeInfo: null });

            // Show error if 502 Bad Gateway or Timeout
            if ((error.response && error.response.status === 502) || error.code === 'ECONNABORTED') {
                this.setState({
                    errorPopup: {
                        title: "Server unavailable",
                        message: "We could not reach the routing service. Please try again in a moment.",
                    },
                });
            }
        } finally {
            this.setState({ isLoadingRoute: false });
        }
    };

    formatSteps = (legs) => {
        const steps = [];
        if (legs && Array.isArray(legs)) {
            legs.forEach((leg) => {
                if (leg.steps && Array.isArray(leg.steps)) {
                    leg.steps.forEach((step) => {
                        steps.push(step);
                    });
                }
            });
        }
        return steps;
    };

    drawPolyLine = async (map, encodedPolyline) => {
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

        return polyline;
    };

    getMarkerCoords = (marker) => {
        if (!marker || !marker.position) return null;

        const { lat, lng } = this.normalizeLatLng(marker.position);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        return {
            latitude: lat,
            longitude: lng,
        };
    };

    saveMarkerPlace = async (marker, type, rawLabel) => {
        if (!marker?.position) {
            return { success: false, message: "Location marker missing. Please set it again." };
        }

        const label = typeof rawLabel === "string" ? rawLabel.trim() : "";
        if (!label) {
            return { success: false, message: "Please enter a name before saving." };
        }
        if (label.length > 80) {
            return { success: false, message: "Keep it under 80 characters." };
        }

        const pos = marker.position;

        const rawLat =
            typeof pos.lat === "function" ? pos.lat() : pos.lat;

        const rawLng =
            typeof pos.lng === "function" ? pos.lng() : pos.lng;

        if (rawLat == null || rawLng == null) {
            return { success: false, message: "Location is not ready yet. Try again in a moment." };
        }

        const latitudeValue = Number(rawLat);
        const longitudeValue = Number(rawLng);
        if (!Number.isFinite(latitudeValue) || !Number.isFinite(longitudeValue)) {
            return { success: false, message: "Location is not ready yet. Try again in a moment." };
        }

        const latitude = Number(latitudeValue.toFixed(6));
        const longitude = Number(longitudeValue.toFixed(6));

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return { success: false, message: "Location is not ready yet. Try again in a moment." };
        }

        let address = "";
        try {
            if (window.google?.maps?.Geocoder) {
                const geocoder = new window.google.maps.Geocoder();
                address = await new Promise((resolve, reject) => {
                    geocoder.geocode(
                        { location: { lat: latitude, lng: longitude } },
                        (results, status) => {
                            if (status === "OK" && results?.[0]) {
                                resolve(results[0].formatted_address);
                            } else {
                                reject(new Error("Reverse geocode failed"));
                            }
                        }
                    );
                });
            }
        } catch (error) {
            console.warn("Reverse geocoding failed, saving without address.", error);
            address = "";
        }

        const payload = {
            label,
            latitude,
            longitude,
            address,
        };

        try {
            await apiPost("/user/saved-destinations/", payload);
            console.log("Saved place:", label, address);
            return { success: true };
        } catch (error) {
            console.error("Failed to save place:", error);
            const message = typeof error?.message === "string" && error.message.trim()
                ? error.message
                : "Failed to save place. Please try again.";
            const normalized = message.toLowerCase();
            if (normalized.includes("login") || normalized.includes("token")) {
                return { success: false, message: "Please log in again to save places." };
            }
            if (normalized.includes("timeout")) {
                return { success: false, message: "Request timed out. Please try again." };
            }
            if (normalized.includes("unique") || normalized.includes("already")) {
                return { success: false, message: "That name already exists. Choose a different label." };
            }
            return { success: false, message };
        }
    };

    openSavePlaceDialog = (type, marker) => {
        if (!marker) {
            this.setState({
                errorPopup: {
                    title: `No ${type.toLowerCase()} set`,
                    message: `Set a ${type.toLowerCase()} on the map before saving it.`,
                },
            });
            return;
        }
        this.setState({
            savePlaceModalOpen: true,
            savePlaceType: type,
            savePlaceLabel: "",
            savePlaceMarker: marker,
            savePlaceError: "",
        });
    };

    closeSavePlaceDialog = () => {
        this.setState({
            savePlaceModalOpen: false,
            savePlaceType: "",
            savePlaceLabel: "",
            savePlaceMarker: null,
            savePlaceError: "",
            isSavingPlace: false,
        });
    };

    updateSavePlaceLabel = (value) => {
        this.setState({ savePlaceLabel: value, savePlaceError: "" });
    };

    confirmSavePlace = async () => {
        const { savePlaceLabel, savePlaceMarker, savePlaceType, isSavingPlace } = this.state;
        if (isSavingPlace) return;
        const trimmed = typeof savePlaceLabel === "string" ? savePlaceLabel.trim() : "";
        if (!trimmed) {
            this.setState({ savePlaceError: "Please enter a name." });
            return;
        }
        if (trimmed.length > 80) {
            this.setState({ savePlaceError: "Keep it under 80 characters." });
            return;
        }

        this.setState({ isSavingPlace: true, savePlaceError: "" });
        const result = await this.saveMarkerPlace(savePlaceMarker, savePlaceType, trimmed);
        if (result?.success) {
            this.setState({
                savePlaceModalOpen: false,
                savePlaceType: "",
                savePlaceLabel: "",
                savePlaceMarker: null,
                savePlaceError: "",
                isSavingPlace: false,
            });
            return;
        }
        this.setState({
            savePlaceError: result?.message || "Failed to save place. Please try again.",
            isSavingPlace: false,
        });
    };

    saveOriginPlace = async () => {
        const { mapMarkers } = this.state;
        if (!mapMarkers?.origin) {
            this.setState({
                errorPopup: {
                    title: "Origin missing",
                    message: "Set an origin on the map before saving it.",
                },
            });
            return;
        }
        this.openSavePlaceDialog("Origin", mapMarkers.origin);
    };

    saveDestinationPlace = async () => {
        const { mapMarkers } = this.state;
        if (!mapMarkers?.destination) {
            this.setState({
                errorPopup: {
                    title: "Destination missing",
                    message: "Set a destination on the map before saving it.",
                },
            });
            return;
        }
        this.openSavePlaceDialog("Destination", mapMarkers.destination);
    };

    generateStartTimes = () => {
        const times = [];
        const now = new Date();
        const intervalMinutes = 5;
        const totalSlots = 24;

        for (let i = 0; i < totalSlots; i++) {
            const offsetMinutes = i === 0 ? 0 : i * intervalMinutes;
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
    };

    parseDurationSeconds = (durationSeconds) => {
        let duration = durationSeconds;
        if (typeof duration === "string") {
            duration = duration.replace("s", "");
        }
        duration = Number(duration);
        return Number.isFinite(duration) ? duration : null;
    };

    formatDurationInfo = (durationSeconds) => {
        const duration = this.parseDurationSeconds(durationSeconds);
        if (duration === null) {
            return { text: "N/A", totalMinutes: null };
        }
        const totalMinutes = Math.max(0, Math.round(duration / 60));
        const hrs = Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const text = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
        return { text, totalMinutes };
    };

    formatDistance = (meters) => {
        if (!meters || isNaN(meters)) return "N/A";
        return (meters / 1000).toFixed(1);
    };

    parseDepartureDate = (value) => {
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
    };

    formatDate = (dateString) => {
        const date = this.parseDepartureDate(dateString);
        if (!date) return "N/A";
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    formatEtaTimeByMinutes = (departureTime, totalMinutes) => {
        const departure = this.parseDepartureDate(departureTime);
        if (!departure || !Number.isFinite(totalMinutes)) return "N/A";
        const arrival = new Date(departure.getTime() + totalMinutes * 60000);
        return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    syncReportMarkers = () => {
        const map = this.mapInstanceRef;
        if (!this.state.mapReady || !map) return;

        this.reportMarkersRunId += 1;
        const runId = this.reportMarkersRunId;

        (async () => {
            const g = window.google;
            if (!g?.maps?.importLibrary) return;
            const { AdvancedMarkerElement } = await g.maps.importLibrary("marker");
            if (runId !== this.reportMarkersRunId) return;

            const markers = this.reportMarkersRef;
            const nextIds = new Set(this.state.reports.map((r) => r.id));

            for (const [id, marker] of markers.entries()) {
                if (!nextIds.has(id)) {
                    marker.map = null;
                    markers.delete(id);
                }
            }

            for (const report of this.state.reports) {
                if (markers.has(report.id)) continue;
                const lat = Number(report.latitude);
                const lng = Number(report.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

                const marker = new AdvancedMarkerElement({
                    map,
                    position: { lat, lng },
                    title: report.report_type,
                    content: this.createIncidentPinContent(report.report_type),
                });
                marker.addListener("gmp-click", () => this.setSelectedReport(report));
                markers.set(report.id, marker);
            }
        })().catch((err) => console.error("Failed to render incident report markers:", err));
    };

    // NAVIGATION FUNCTIONS ------------------------------------------------------------

    handleNavigationProgress = () => {
        const navigationPathway = this.state.routeInfo?.steps;
        if (!navigationPathway) {
            console.log("No navigation pathway available.");
            return
        };

        const userLoc = { lat: this.prevLocationRef.current?.latitude, lng: this.prevLocationRef.current?.longitude };
        let nextPoint = { lat: 0, lng: 0 };
        let shouldCameraPan = true;

        let maxCutoffDistance = this.isMobileDevice ? 10 : 50; // meters
        console.log("Navigation Index:", this.state.navigationIndex);
        console.log("Navigation Pathway Length:", navigationPathway?.length);
        if (this.state.navigationIndex >= navigationPathway?.length) {
            console.log("Reached destination in navigation mode.");
            this.showNavEndScreen();
            return;
        }

        if (this.state.navigationIndex == 0 && this.isAToBRef.current === true) {
            nextPoint = navigationPathway[0]
            shouldCameraPan = false;
        } else if (this.state.navigationIndex < navigationPathway.length - 1) {
            nextPoint = navigationPathway[this.state.navigationIndex + 1];
            shouldCameraPan = true;
        }
        
        console.log("User location:", userLoc, "Next point:", nextPoint);

        let nextPointEndPoint = nextPoint?.endLocation.latLng;
        let distance = google.maps.geometry.spherical.computeDistanceBetween(
            new google.maps.LatLng(userLoc.lat, userLoc.lng),
            new google.maps.LatLng(nextPointEndPoint.latitude, nextPointEndPoint.longitude),
        );
        
        console.log("Should camera pan", shouldCameraPan);
        console.log("Distance to next point:", distance, "meters");

        if (shouldCameraPan === true && distance < maxCutoffDistance) {
            console.log("Panning camera to next point...");
            const map = this.state.mapRef || this.mapInstanceRef;
            this.panToLocation(map, userLoc, nextPoint);
        }

        if (distance < maxCutoffDistance) {
            this.setState((prevState) => ({
                navigationIndex: Math.min(prevState.navigationIndex + 1, navigationPathway.length - 1),
            }));
        }
    };

    showTimeSelectorFunction = () => {
        this.setState({ showTimeSelector: !this.state.showTimeSelector });
    }

    liveNavigateToDestination = () => {
        console.log("Starting live navigation animation...");
        const totalTime = 1500;

        if (!this.state.mapPolylines || this.state.mapPolylines.length === 0) {
            console.error("Cannot start navigation: No route polyline available.");
            return;
        }

        const lastPolyline = this.state.mapPolylines[this.state.mapPolylines.length - 1];
        if (!lastPolyline) return;

        const navigationPathway = lastPolyline.getPath().getArray();

        console.log("Most recent polyline:", navigationPathway);
        const currentIndex = this.state.navigationIndex;
        this.setState({ navigationIndex: 0 });

        console.log("Navigation pathway length:", navigationPathway.length);
        let currentPoint = navigationPathway[currentIndex];
        let nextPoint = navigationPathway[currentIndex + 1];
        console.log("Current point:", currentPoint, "Next point:", nextPoint);

        const map = this.state.mapRef || this.mapInstanceRef;

        this.transitionToNavigationScreen();
        if (this.isAToBRef.current === false) {
            const userLoc = { lat: this.prevLocationRef.current.latitude, lng: this.prevLocationRef.current.longitude };
            this.panToLocation(map, userLoc, nextPoint, totalTime);
        } else {
            this.panToLocation(map, currentPoint, nextPoint, totalTime);
        }
        this.setState({ isNavigationBegun: true });
    };

    transitionToNavigationScreen = () => {
        this.setState({ showAll: false, showNavigationScreen: true });
    };

    panToLocation = (map, curLocation, nextlocation, totalTime = 1500) => {
        console.log("Panning from", curLocation, "to", nextlocation);
        const heading = google.maps.geometry.spherical.computeHeading(
            new google.maps.LatLng(curLocation),
            new google.maps.LatLng(nextlocation)
        );

        const cameraOptions = {
            tilt: map.getTilt(),
            heading: map.getHeading(),
            zoom: map.getZoom(),
            center: new google.maps.LatLng(curLocation),
        };

        const tween = new Tween(cameraOptions)
            .to({ tilt: 40, heading: heading, zoom: 18, center: new google.maps.LatLng(curLocation) }, totalTime)
            .easing(Easing.Quadratic.Out)
            .onUpdate(() => { map.moveCamera(cameraOptions); })
            .start();

        function animate(time) {
            requestAnimationFrame(animate);
            tween.update(time);
            if (tween.isPlaying() === false) {
                console.log("Completed panning to next location.");
                tween.remove();
            }
        }
        requestAnimationFrame(animate);
    };

    showNavEndScreen = () => {
        this.setState({ showNavigationScreen: false, showAll: false, showNavigationEndScreen: true });
    };

    finishNavigation = () => {
        this.setState({
            showNavigationEndScreen: false,
            showNavigationScreen: false,
            showAll: true,
            isNavigationBegun: false,
            navigationIndex: 0,
        });
        console.log("Navigation finished, returning to map view.");
        const map = this.state.mapRef || this.mapInstanceRef;
        const curLocation = this.prevLocationRef?.current ?
            { lat: this.prevLocationRef.current.latitude, lng: this.prevLocationRef.current.longitude } :
            { lat: this.mockLocation.latitude, lng: this.mockLocation.longitude };
        const totalTime = 1500;

        const cameraOptions = {
            tilt: map.getTilt(),
            heading: map.getHeading(),
            zoom: map.getZoom(),
            center: new google.maps.LatLng(curLocation),
        };

        const tween = new Tween(cameraOptions)
            .to({ tilt: 0, heading: 0, zoom: 10, center: new google.maps.LatLng(curLocation) }, totalTime)
            .easing(Easing.Quadratic.Out)
            .onUpdate(() => { map.moveCamera(cameraOptions); })
            .start();

        function animate(time) {
            requestAnimationFrame(animate);
            tween.update(time);
        }
        requestAnimationFrame(animate);

        this.clearMap();
    };

    // --------------------------------------------------------------------

    setShowDropdown = (valueOrUpdater) => {
        if (typeof valueOrUpdater === "function") {
            this.setState((prevState) => ({ showDropdown: valueOrUpdater(prevState.showDropdown) }));
        } else {
            this.setState({ showDropdown: valueOrUpdater });
        }
    };

    setErrorPopup = (valueOrUpdater) => {
        if (typeof valueOrUpdater === "function") {
            this.setState((prevState) => ({ errorPopup: valueOrUpdater(prevState.errorPopup) }));
        } else {
            this.setState({ errorPopup: valueOrUpdater });
        }
    };

    setShowLogoutConfirm = (valueOrUpdater) => {
        if (typeof valueOrUpdater === "function") {
            this.setState((prevState) => ({ showLogoutConfirm: valueOrUpdater(prevState.showLogoutConfirm) }));
        } else {
            this.setState({ showLogoutConfirm: valueOrUpdater });
        }
    };

    setSelectedReport = (valueOrUpdater) => {
        if (typeof valueOrUpdater === "function") {
            this.setState((prevState) => ({ selectedReport: valueOrUpdater(prevState.selectedReport) }));
        } else {
            this.setState({ selectedReport: valueOrUpdater });
        }
    };

    setReports = (valueOrUpdater) => {
        if (typeof valueOrUpdater === "function") {
            this.setState((prevState) => ({ reports: valueOrUpdater(prevState.reports) }));
        } else {
            this.setState({ reports: valueOrUpdater });
        }
    };

    setIsAToBState = (valueOrUpdater) => {
        if (typeof valueOrUpdater === "function") {
            this.setState((prevState) => {
                const nextValue = valueOrUpdater(prevState.isAToBState);
                this.isAToBRef.current = nextValue;
                return { isAToBState: nextValue };
            });
        } else {
            this.isAToBRef.current = valueOrUpdater;
            this.setState({ isAToBState: valueOrUpdater });
        }
    };

    setUserLocation = (valueOrUpdater) => {
        if (typeof valueOrUpdater === "function") {
            this.setState((prevState) => ({ userLocation: valueOrUpdater(prevState.userLocation) }));
        } else {
            this.setState({ userLocation: valueOrUpdater });
        }
    };
    toggleTollRoads = async () => {
        this.context.setIsTollRoadsOn(prev => !prev);
    };

    toggleSaveMenu = () => {
        this.setState((prev) => ({ showSaveMenu: !prev.showSaveMenu }));
    };

    closeSaveMenu = () => {
        this.setState({ showSaveMenu: false });
    };

    handleSaveOriginClick = async () => {
        await this.saveOriginPlace();
        this.closeSaveMenu();
    };

    handleSaveDestinationClick = async () => {
        await this.saveDestinationPlace();
        this.closeSaveMenu();
    };

    openSavedDestinations = async () => {
        const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
        this.setState((prevState) => ({
            showSavedDestinations: true,
            showRouteOptions: isMobile ? true : prevState.showRouteOptions,
        }));

        await this.fetchSavedDestinations();
    };

    closeSavedDestinations = () => {
        this.setState({ showSavedDestinations: false });
    };

    fetchSavedDestinations = async () => {
        try {
            this.setState({ isLoadingSavedDestinations: true });

            const res = await apiGet("/user/saved-destinations/");
            const data = Array.isArray(res) ? res : (res?.data ?? []);
            this.setState({ savedDestinations: data });
        } catch (e) {
            console.error("Failed to fetch saved destinations:", e);
            this.setState({
                errorPopup: {
                    title: "Saved destinations unavailable",
                    message: "We could not load your saved destinations. Please try again.",
                },
            });
        } finally {
            this.setState({ isLoadingSavedDestinations: false });
        }
    };

    selectSavedDestination = async (dest) => {
        const map = this.state.mapRef || this.mapInstanceRef;
        const cur = this.getCurrentUserLatLng();
        if (!map || !cur) {
            this.setState({
                errorPopup: {
                    title: "Location not ready",
                    message: "Your current location is not available yet. Please try again in a moment.",
                },
            });
            return;
        }

        this.setState({ showSavedDestinations: false });

        this.clearMap();

        const g = window.google;
        if (!g?.maps?.importLibrary) return;
        const { AdvancedMarkerElement } = await g.maps.importLibrary("marker");

        const originMarker = new AdvancedMarkerElement({
            map,
            position: { lat: cur.lat, lng: cur.lng },
            title: "A",
        });

        const destinationMarker = new AdvancedMarkerElement({
            map,
            position: { lat: Number(dest.latitude), lng: Number(dest.longitude) },
            title: "B",
        });

        this.setState({
            mapMarkers: { origin: originMarker, destination: destinationMarker },
            showRouteOptions: true,
            showSaveMenu: false,
        });

        const selectedOffsetMinutes = this.state.selectedOffsetMinutes ?? 1;
        await this.fetchRoute(originMarker.position, destinationMarker.position, selectedOffsetMinutes, map);
    };

    deleteSavedDestination = async (destinationId) => {
        if (!destinationId) return;
        this.setState({ deletingDestinationId: destinationId });
        try {
            await apiDelete(`/user/saved-destinations/${destinationId}/`);
            this.setState((prevState) => ({
                savedDestinations: prevState.savedDestinations.filter((d) => d.id !== destinationId),
            }));
        } catch (error) {
            console.error("Failed to delete saved destination:", error);
            this.setState({
                errorPopup: {
                    title: "Unable to remove destination",
                    message: "We could not remove this saved destination. Please try again.",
                },
            });
        } finally {
            this.setState({ deletingDestinationId: null });
        }
    };

    render() {
        return (
            <MapView
                mapData={this.state.mapData}
                setMarker={this.setMarker}
                hasOrigin={this.state.hasOrigin}
                hasDestination={this.state.hasDestination}
                onPlaceSelected={this.handlePlaceSelected}
                isAToBRef={this.isAToBRef}
                prevLocationRef={this.prevLocationRef}
                setUserLocation={this.setUserLocation}
                showNavigationScreen={this.state.showNavigationScreen}
                routeInfo={this.state.routeInfo}
                navigationIndex={this.state.navigationIndex}
                showNavEndScreen={this.showNavEndScreen}
                speedKmh={this.state.speedKmh}
                showNavigationEndScreen={this.state.showNavigationEndScreen}
                finishNavigation={this.finishNavigation}
                showAll={this.state.showAll}
                selectedReport={this.state.selectedReport}
                setSelectedReport={this.setSelectedReport}
                userLocation={this.state.userLocation}
                setReports={this.setReports}
                isAToBState={this.state.isAToBState}
                setIsAToBState={this.setIsAToBState}
                showTimeSelector={this.state.showTimeSelector}
                showTimeSelectorFunction={this.showTimeSelectorFunction}
                showRouteOptions={this.state.showRouteOptions}
                isTollRoadsOn={this.context.isTollRoadsOn}
                toggleTollRoads={this.toggleTollRoads}
                availableTimes={this.state.availableTimes}
                selectedOffsetMinutes={this.state.selectedOffsetMinutes}
                isLoadingRoute={this.state.isLoadingRoute}
                handleTimeChange={this.handleTimeChange}
                liveNavigateToDestination={this.liveNavigateToDestination}
                clearMap={this.clearMap}
                errorPopup={this.state.errorPopup}
                setErrorPopup={this.setErrorPopup}
                showDropdown={this.state.showDropdown}
                setShowDropdown={this.setShowDropdown}
                username={this.state.username}
                points={this.state.points}
                handleRewardsClick={this.handleRewardsClick}
                handleSettingsClick={this.handleSettingsClick}
                setShowLogoutConfirm={this.setShowLogoutConfirm}
                showLogoutConfirm={this.state.showLogoutConfirm}
                handleLogout={this.handleLogout}
                showSaveMenu={this.state.showSaveMenu}
                toggleSaveMenu={this.toggleSaveMenu}
                closeSaveMenu={this.closeSaveMenu}
                onSaveOriginPlace={this.handleSaveOriginClick}
                onSaveDestinationPlace={this.handleSaveDestinationClick}
                savePlaceModalOpen={this.state.savePlaceModalOpen}
                savePlaceType={this.state.savePlaceType}
                savePlaceLabel={this.state.savePlaceLabel}
                savePlaceError={this.state.savePlaceError}
                isSavingPlace={this.state.isSavingPlace}
                onSavePlaceLabelChange={this.updateSavePlaceLabel}
                onSavePlaceCancel={this.closeSavePlaceDialog}
                onSavePlaceConfirm={this.confirmSavePlace}
                openSavedDestinations={this.openSavedDestinations}
                closeSavedDestinations={this.closeSavedDestinations}
                savedDestinations={this.state.savedDestinations}
                showSavedDestinations={this.state.showSavedDestinations}
                isLoadingSavedDestinations={this.state.isLoadingSavedDestinations}
                deletingDestinationId={this.state.deletingDestinationId}
                selectSavedDestination={this.selectSavedDestination}
                onDeleteSavedDestination={this.deleteSavedDestination}
                onRecenterRequest={this.handleRecenterRequest}
            />
        );
    };
}
