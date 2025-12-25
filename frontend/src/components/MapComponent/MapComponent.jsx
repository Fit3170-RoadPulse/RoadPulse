import { useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import "./MapComponent.css";
import SpeedTracker from "../speed-tracker";

export default function MapComponent({ API_KEY, MAP_ID, map_function }) {
    if (!API_KEY || !MAP_ID) return;
    setOptions({
        key: API_KEY,
        mapIds: [MAP_ID],
    });
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    useEffect(() => {
        let isMounted = true;

        importLibrary("maps").then(() => {
            if (!isMounted || !mapRef.current || mapInstance.current) return;
            const map = new google.maps.Map(mapRef.current, {
                center: { lat: -34.397, lng: 150.644 },
                zoom: 8,
                mapId: MAP_ID,
            });

            mapInstance.current = map;
            if (map_function) map_function(map);
        })
        .catch((err) => {
            console.error("Google Maps failed to load:", err);
        });

        return () => {
            isMounted = false;
        };
    }, [API_KEY, MAP_ID, map_function]);

    return (
        <div className="mapholder" style={{ width: "100%", height: "100%" }}>
        {/* Speed Tracker Overlay
        <div
        style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 10,
        }}
        >
        <SpeedTracker />
        </div> */}
        <div
            ref={mapRef}
            style={{ width: "100%", height: "100%", minHeight: "400px" }}
        />
        </div>
    );
}