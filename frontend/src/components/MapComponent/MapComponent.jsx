import { useEffect, useRef, useState } from "react";
import { LocateFixed, Star } from "lucide-react";
import "./MapComponent.css";
import { ensureMapsLoaderOptions, loadMapsLibrary } from "../../lib/googleMapsLoader";

export default function MapComponent({
    API_KEY,
    MAP_ID,
    map_function,
    toggleSelectionType = true,
    currentLocation = {
        latitude: -37.813904798147796,
        longitude: 144.98810008133233,
        accuracy: 50,
        timestamp: Date.now(),
    },
    showUserLocation = false,
    onUserLocation,
    externalUserLocation = null,
    useExternalUserLocation = false,
    showRecenterButton = true,
    onRecenterRequest = null,
    recenterMinZoom = 14,
    onSavedDestinationsClick = null,
}) {
    const mapRef = useRef(null);
    const mapHolderRef = useRef(null);
    const mapInstance = useRef(null);
    const userMarkerRef = useRef(null);
    const userAccuracyCircleRef = useRef(null);
    const geoWatchIdRef = useRef(null);
    const hasCenteredRef = useRef(false);
    const updateUserLocationRef = useRef(null);
    const pendingExternalLocationRef = useRef(null);
    const lastUserLocationRef = useRef(null);
    const [hasLocation, setHasLocation] = useState(false);



    useEffect(() => {
        if (typeof document === "undefined" || typeof window === "undefined") return;
        const isWithinMap = (target) => {
            if (!target || typeof target.closest !== "function") return false;
            return Boolean(target.closest(".map-div"));
        };
        const shouldBlockZoom = (event) => !isWithinMap(event.target);

        const handleTouchStart = (event) => {
            if (event.touches?.length > 1 && shouldBlockZoom(event)) {
                event.preventDefault();
            }
        };

        const handleTouchMove = (event) => {
            if (event.touches?.length > 1 && shouldBlockZoom(event)) {
                event.preventDefault();
            }
        };

        const handleGesture = (event) => {
            if (shouldBlockZoom(event)) {
                event.preventDefault();
            }
        };

        const handleWheel = (event) => {
            if (!event.ctrlKey || !shouldBlockZoom(event)) return;
            event.preventDefault();
        };

        const mediaQuery = window.matchMedia("(max-width: 768px)");
        let listenersAttached = false;
        const attachListeners = () => {
            if (listenersAttached) return;
            listenersAttached = true;
            document.addEventListener("touchstart", handleTouchStart, { passive: false });
            document.addEventListener("touchmove", handleTouchMove, { passive: false });
            document.addEventListener("gesturestart", handleGesture, { passive: false });
            document.addEventListener("gesturechange", handleGesture, { passive: false });
            document.addEventListener("gestureend", handleGesture, { passive: false });
            document.addEventListener("wheel", handleWheel, { passive: false });
        };

        const detachListeners = () => {
            if (!listenersAttached) return;
            listenersAttached = false;
            document.removeEventListener("touchstart", handleTouchStart);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("gesturestart", handleGesture);
            document.removeEventListener("gesturechange", handleGesture);
            document.removeEventListener("gestureend", handleGesture);
            document.removeEventListener("wheel", handleWheel);
        };

        const handleMediaChange = () => {
            if (mediaQuery.matches) {
                attachListeners();
            } else {
                detachListeners();
            }
        };

        handleMediaChange();
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener("change", handleMediaChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleMediaChange);
        }

        return () => {
            detachListeners();
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener("change", handleMediaChange);
            } else if (mediaQuery.removeListener) {
                mediaQuery.removeListener(handleMediaChange);
            }
        };
    }, []);

    const handleRecenterClick = () => {
        const map = mapInstance.current;
        const location = lastUserLocationRef.current;
        if (!map || !location) return;

        if (typeof onRecenterRequest === "function") {
            const handled = onRecenterRequest({ map, location });
            if (handled) return;
        }

        map.panTo({ lat: location.lat, lng: location.lng });
        const currentZoom = map.getZoom?.();
        if (!Number.isFinite(currentZoom) || currentZoom < recenterMinZoom) {
            map.setZoom(recenterMinZoom);
        }
    };

    const applyExternalLocation = (location) => {
        if (!location) return;
        const lat = Number(location.latitude ?? location.lat);
        const lng = Number(location.longitude ?? location.lng);
        const accuracy = Number(location.accuracy ?? location.accuracyMeters);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const updater = updateUserLocationRef.current;
        if (updater) {
            updater(lat, lng, accuracy);
        } else {
            pendingExternalLocationRef.current = { lat, lng, accuracy };
        }
    };

    useEffect(() => {
        let isMounted = true;

        if (!API_KEY || !MAP_ID) return () => { isMounted = false; };

        ensureMapsLoaderOptions(API_KEY, MAP_ID);

        Promise.all([
            loadMapsLibrary("maps", API_KEY, MAP_ID),
            loadMapsLibrary("geometry", API_KEY, MAP_ID),
        ]).then(([lib]) => {
            if (!isMounted || !mapRef.current || mapInstance.current) return;
            const MapCtor = lib?.Map || window.google?.maps?.Map;
            if (!MapCtor) return;
            const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
            const map = new MapCtor(mapRef.current, {
                center: { lat: -34.397, lng: 150.644 },
                zoom: 8,
                mapId: MAP_ID,
                fullscreenControl: false,
                renderingType: google.maps.RenderingType.VECTOR,
                ...(isMobile
                    ? {
                        zoomControl: false,
                        mapTypeControl: true,
                        fullscreenControl: false,
                        streetViewControl: false,
                        rotateControl: false,
                        scaleControl: false,
                        panControl: false,
                        keyboardShortcuts: false,
                    }
                    : {}),
            });

            mapInstance.current = map;
            if (map_function) map_function(map);

            const g = window.google;
            if (!g?.maps) return;

            const updateUserLocation = (lat, lng, accuracyMeters) => {
                const pos = { lat, lng };
                lastUserLocationRef.current = { lat, lng, accuracyMeters, timestamp: Date.now() };
                setHasLocation(true);
                const accuracyRadiusMeters = 150;

                if (!userMarkerRef.current) {
                    userMarkerRef.current = new g.maps.Marker({
                        map,
                        position: pos,
                        clickable: false,
                        zIndex: 9999,
                        title: "Your location",
                        icon: {
                            path: g.maps.SymbolPath.CIRCLE,
                            scale: 7,
                            fillColor: "#2563EB",
                            fillOpacity: 1,
                            strokeColor: "#FFFFFF",
                            strokeWeight: 2,
                        },
                    });
                } else {
                    userMarkerRef.current.setPosition(pos);
                }

                if (!userAccuracyCircleRef.current) {
                    userAccuracyCircleRef.current = new g.maps.Circle({
                        map,
                        center: pos,
                        radius: accuracyRadiusMeters,
                        fillColor: "#60A5FA",
                        fillOpacity: 0.18,
                        strokeColor: "#3B82F6",
                        strokeOpacity: 0.55,
                        strokeWeight: 1,
                        clickable: false,
                        zIndex: 9998,
                    });
                } else {
                    userAccuracyCircleRef.current.setCenter(pos);
                    userAccuracyCircleRef.current.setRadius(accuracyRadiusMeters);
                }

                if (!hasCenteredRef.current) {
                    hasCenteredRef.current = true;
                    map.panTo(pos);
                    map.setZoom(14);
                }

                if (typeof onUserLocation === "function") onUserLocation({ lat, lng, accuracyMeters });
            };

            updateUserLocationRef.current = updateUserLocation;
            if (pendingExternalLocationRef.current) {
                const pending = pendingExternalLocationRef.current;
                pendingExternalLocationRef.current = null;
                updateUserLocation(pending.lat, pending.lng, pending.accuracy);
            }

            if (useExternalUserLocation) {
                applyExternalLocation(externalUserLocation);
            }

            if (showUserLocation && navigator?.geolocation && !useExternalUserLocation) {
                const g = window.google;
                if (!g?.maps) return;

                geoWatchIdRef.current = navigator.geolocation.watchPosition(
                    (pos) => {
                        if (!isMounted) return;
                        const lat = Number(pos?.coords?.latitude);
                        const lng = Number(pos?.coords?.longitude);
                        const acc = Number(pos?.coords?.accuracy);
                        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                        updateUserLocation(lat, lng, acc);
                    },
                    () => {
                        // ignore; user might deny location
                    },
                    { enableHighAccuracy: true, maximumAge: 15000, timeout: 8000 }
                );
            }
        })
            .catch((err) => {
                console.error("Google Maps failed to load:", err);
            });

        return () => {
            isMounted = false;
            if (geoWatchIdRef.current != null && navigator?.geolocation) {
                navigator.geolocation.clearWatch(geoWatchIdRef.current);
                geoWatchIdRef.current = null;
            }
            if (userMarkerRef.current) {
                userMarkerRef.current.setMap(null);
                userMarkerRef.current = null;
            }
            if (userAccuracyCircleRef.current) {
                userAccuracyCircleRef.current.setMap(null);
                userAccuracyCircleRef.current = null;
            }
            hasCenteredRef.current = false;
            setHasLocation(false);
        };
    }, [API_KEY, MAP_ID, map_function, showUserLocation, onUserLocation, toggleSelectionType, useExternalUserLocation]);

    useEffect(() => {
        if (!useExternalUserLocation) return;
        applyExternalLocation(externalUserLocation);
    }, [externalUserLocation, useExternalUserLocation]);

    return (
        <div ref={mapHolderRef} className="map-holder">
            <div
                ref={mapRef}
                className="map-div"
            />
            {showRecenterButton && (
                <div className="map-recenter-container">
                    <button
                        type="button"
                        className={`map-recenter-button ${hasLocation ? "" : "is-disabled"}`}
                        onClick={handleRecenterClick}
                        aria-label="Recenter map on your location"
                        title="Recenter"
                        disabled={!hasLocation}
                    >
                        <LocateFixed
                            className="map-recenter-icon"
                            size={32}
                            strokeWidth={2.75}
                            absoluteStrokeWidth
                        />
                    </button>
                </div>
            )}
            {typeof onSavedDestinationsClick === "function" && (
                <div className="map-saved-destinations-container">
                    <button
                        type="button"
                        className="map-saved-destinations-button"
                        onClick={onSavedDestinationsClick}
                        aria-label="Open saved destinations"
                        title="Saved destinations"
                    >
                        <Star
                            className="map-saved-destinations-icon"
                            size={26}
                            strokeWidth={2.5}
                            absoluteStrokeWidth
                        />
                    </button>
                </div>
            )}
        </div>
    );
}
