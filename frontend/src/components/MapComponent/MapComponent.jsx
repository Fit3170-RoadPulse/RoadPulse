import { useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import "./MapComponent.css";

export default function MapComponent({ API_KEY, MAP_ID, map_function, showUserLocation = false, onUserLocation }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const userMarkerRef = useRef(null);
    const userAccuracyCircleRef = useRef(null);
    const geoWatchIdRef = useRef(null);
    const hasCenteredRef = useRef(false);
    const latestFixRef = useRef(null);
    const uiTickIntervalRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        if (!API_KEY || !MAP_ID) return () => { isMounted = false; };

        setOptions({
            key: API_KEY,
            mapIds: [MAP_ID],
        });

        importLibrary("maps").then((lib) => {
            if (!isMounted || !mapRef.current || mapInstance.current) return;
            const MapCtor = lib?.Map || window.google?.maps?.Map;
            if (!MapCtor) return;
            const map = new MapCtor(mapRef.current, {
                center: { lat: -34.397, lng: 150.644 },
                zoom: 8,
                mapId: MAP_ID,
            });

            mapInstance.current = map;
            if (map_function) map_function(map);

            if (showUserLocation && navigator?.geolocation) {
                const g = window.google;
                if (!g?.maps) return;

                const updateUserLocation = (lat, lng, accuracyMeters, timestamp, emit = true) => {
                    const pos = { lat, lng };
                    latestFixRef.current = { lat, lng, accuracyMeters, timestamp };

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
                            radius: Math.max(10, Number(accuracyMeters) || 0),
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
                        userAccuracyCircleRef.current.setRadius(Math.max(10, Number(accuracyMeters) || 0));
                    }

                    if (!hasCenteredRef.current) {
                        hasCenteredRef.current = true;
                        map.panTo(pos);
                        map.setZoom(14);
                    }

                    if (emit && typeof onUserLocation === "function") {
                        onUserLocation({ lat, lng, accuracyMeters, timestamp });
                    }
                };

                geoWatchIdRef.current = navigator.geolocation.watchPosition(
                    (pos) => {
                        if (!isMounted) return;
                        const lat = Number(pos?.coords?.latitude);
                        const lng = Number(pos?.coords?.longitude);
                        const acc = Number(pos?.coords?.accuracy);
                        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                        updateUserLocation(lat, lng, acc, pos?.timestamp, true);
                    },
                    () => {
                        // ignore; user might deny location
                    },
                    { enableHighAccuracy: true, maximumAge: 15000, timeout: 8000 }
                );

                uiTickIntervalRef.current = setInterval(() => {
                    if (!isMounted) return;
                    const latest = latestFixRef.current;
                    if (!latest) return;
                    updateUserLocation(
                        latest.lat,
                        latest.lng,
                        latest.accuracyMeters,
                        latest.timestamp,
                        false
                    );
                }, 1000);
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
            if (uiTickIntervalRef.current) {
                clearInterval(uiTickIntervalRef.current);
                uiTickIntervalRef.current = null;
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
        };
    }, [API_KEY, MAP_ID, map_function, showUserLocation, onUserLocation]);

    return (
        <div className="mapholder" style={{ width: "100%", height: "100%" }}>
        <div
            ref={mapRef}
            style={{ width: "100%", height: "100%", minHeight: "400px" }}
        />
        </div>
    );
}
