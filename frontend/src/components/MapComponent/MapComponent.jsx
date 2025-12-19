import { useEffect, useRef } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import "./MapComponent.css";

export default function MapComponent({ API_KEY, MAP_ID, map_function }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

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
        <div
            ref={mapRef}
            style={{ width: "100%", height: "100%", minHeight: "400px" }}
        />
        </div>
    );
}
