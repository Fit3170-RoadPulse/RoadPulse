import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef} from "react";
import axios from "axios";
import { User, Award, Settings, LogOut } from "lucide-react";
import MapComponent from "../../components/MapComponent/MapComponent";
import MapPage from "../../components/MapSideBarComponent/MapSideBarComponent";
import "./Map.css"
import SpeedTracker from "../../components/speed-tracker";
import RewardsPage from "../rewardspage/RewardsPage";

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function Map() {
    let [mapData, setMapData] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [points] = useState(1000); // Replace with actual user points
    const navigate = useNavigate();
    const [routeInfo, setRouteInfo] = useState([])
    let routeInfoRows = [];
    // const [useMockPath, setUseMockPath] = useState(true);

    const [location, setLocation] = useState(null);
    const [speedKmh, setSpeedKmh] = useState(null);
    const prevLocationRef = useRef(null);
    const mapRef = useRef(null);

    const originRef = useRef(null);
    const destinationRef = useRef(null);
    const polylineRef = useRef(null);
    const lastEtaSecRef = useRef(null);
    const lastRerouteAtRef = useRef(0);
    const locationRef = useRef(null);
    const [hasRoute, setHasRoute] = useState(false);

    const REROUTE_INTERVAL_MS = 30000; // every 30s
    const [rerouteCount, setRerouteCount] = useState(0);
    const ETA_CHANGE_THRESHOLD_SEC = 120; // reroute if ETA changes by >= 2 min

    let locationPollingData = useRef(null);
    let lastUpdateTimeRef = useRef(0);

    // Fallback mock location (used if real geolocation fails)
    // const mockLocation = {
    //     latitude: -37.813904798147796, 
    //     longitude: 144.98810008133233,
    //     accuracy: 50,
    //     timestamp: Date.now(),
    // };

    // const mockPath = [
    //     { latitude: -37.8139, longitude: 144.9881 },
    //     { latitude: -37.8137, longitude: 144.9881 },
    //     { latitude: -37.8134, longitude: 144.9881 },
    //     { latitude: -37.8130, longitude: 144.9881 },
    //     { latitude: -37.8125, longitude: 144.9881 },
    //     { latitude: -37.8122, longitude: 144.9881 },
    //     { latitude: -37.8120, longitude: 144.9881 },
    // ];

  // ----------------------------
  // Effect A: load backend config + start REAL GPS watcher (runs once)
  // ----------------------------    

    useEffect(() => {
        const base = import.meta.env.VITE_API_URL || "";
        axios.get(`${base}/api/map/`).then((r) => {
            setMapData(r.data)
        });

        axios.get(`${base}/api/map/location/`).then((r) => {
            locationPollingData.current = r.data;
            console.log("Location Polling Data Ref:", locationPollingData);

            // if (!navigator.geolocation) {
            //     setLocation(mockLocation);
            //     console.log('Geolocation is not supported by your browser');
            //     return;
            // }

            // Success handler: updates the state with the new position
            const successHandler = (position) => {
                const now = Date.now();
                // Only update if the specified interval has passed since the last update
                if (now - lastUpdateTimeRef.current >= locationPollingData.current?.pollingInterval) {
                    let newLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: position.timestamp,
                        // speedMps: position.coords.speed,
                    };
                    setLocation(newLocation);
                    lastUpdateTimeRef.current = now;
                    console.log("Location updated:", newLocation);
                }
            };

            // Error handler: updates the error state
            const errorHandler = (err) => {
                console.error("Geolocation error:", {
                    code: err.code,
                    message: err.message,
                });
                
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

  // ----------------------------
  // Effect B: Mock GPS path generator
  // ----------------------------    

    // useEffect(() => {
    //     if (!useMockPath) return;

    //     let index = 0;

    //     const interval = setInterval(() => {
    //         const point = mockPath[index % mockPath.length];

    //         const mockLocation = {
    //         latitude: point.latitude,
    //         longitude: point.longitude,
    //         accuracy: 5,
    //         timestamp: Date.now(),
    //         };

    //         setLocation(mockLocation);
    //         console.log("Mock location:", mockLocation);

    //         index++;
    //     }, 2000);

    //     return () => clearInterval(interval);
    // }, [useMockPath]);

  // ----------------------------
  // Effect C: Speed calculation from location updates
  // ----------------------------
  useEffect(() => {
    if (!location) return;

    const prev = prevLocationRef.current;
    prevLocationRef.current = location;

    if (!prev) {
      setSpeedKmh(0);
      return;
    }

    // const speedMps =
    //   typeof location.speedMps === "number" && Number.isFinite(location.speedMps)
    //     ? location.speedMps
    //     : null;
    // const kmh = speedMps !== null ? Math.max(0, speedMps * 3.6) : 0;

    const t1 = typeof prev.timestamp === "number" ? prev.timestamp : Date.now();
    const t2 = typeof location.timestamp === "number" ? location.timestamp : Date.now();
    const dtMs = t2 - t1;

    // if (!Number.isFinite(dtMs) || dtMs <= 0) return;

    const distM = haversineMeters(
      prev.latitude,
      prev.longitude,
      location.latitude,
      location.longitude
    );

    const kmh = (distM / (dtMs / 1000)) * 3.6;

    // show stable value; small jitter becomes 0
    const shown = kmh < 1 ? 0 : Math.round(kmh);

    console.log("dist(m):", distM.toFixed(2), "dt(ms):", dtMs, "km/h:", kmh.toFixed(2))
    // console.log("speed(m/s):", speedMps ?? "N/A", "km/h:", kmh.toFixed(2));
    setSpeedKmh(shown);
  }, [location]);    

    console.log(mapData);

    //periodically calculate route
    useEffect(() => {
        if (!hasRoute) return;

        // only reroute if we have destination + map + current location
        // if (!destinationRef.current || !mapRef.current || !location) return;

        const interval = setInterval(async () => {
            const loc = locationRef.current;
            // must have location and destination
            if (!destinationRef.current || !mapRef.current || !originRef.current) return;


            // throttle so it doesn’t spam if interval is short
            // const now = Date.now();
            // if (now - lastRerouteAtRef.current < REROUTE_INTERVAL_MS - 500) return;

            const origin = originRef.current;
            const destination = destinationRef.current;

            console.log(
            `[REROUTE TICK] ${new Date().toLocaleTimeString()} origin=(${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}) dest=(${destination.lat.toFixed(5)},${destination.lng.toFixed(5)})`
            );

            setRerouteCount((c) => c + 1);
            try {
                const startTimes = generateStartTimes();
                const newEtaSec = await fetchRoute(
                    origin, destination, startTimes, mapRef.current
                );

            // reroute decision: only if ETA changed enough
            const oldEtaSec = lastEtaSecRef.current;
            if (typeof oldEtaSec === "number" && typeof newEtaSec === "number") {
                const diff = Math.abs(newEtaSec - oldEtaSec);

                if (diff >= ETA_CHANGE_THRESHOLD_SEC) {
                console.log("Rerouting (ETA changed):", { oldEtaSec, newEtaSec, diff });
                lastEtaSecRef.current = newEtaSec;
                lastRerouteAtRef.current = now;
                } else {
                // keep last ETA, but we already redrew polyline from fetchRoute
                // If you want "only redraw when needed", move drawPolyLine into this if-block.
                console.log("No significant change, ETA diff:", diff);
                }
            } else {
                lastEtaSecRef.current = newEtaSec;
            }
            } catch (e) {
            console.error("Reroute failed:", e);
            }
        }, REROUTE_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [hasRoute]);

    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    const handleRewardsClick = () => {
        setShowDropdown(false);
        navigate("/rewards-page"); // Navigate to rewards page
    };

    const handleSettingsClick = () => {
        setShowDropdown(false);
        navigate("/setting-menu-page"); // Navigate to settings page
    };


    async function setMarker(map){
        mapRef.current = map;

        let originMarker = null;
        let destinationMarker = null;
        
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);

        const directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        map.addListener("click", async(e) =>{
            const clicked = { lat: e.latLng.lat(), lng: e.latLng.lng() };

            if (!originMarker){
                originMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title:"A",
                });

                // reset route state
                originRef.current = clicked;
                destinationRef.current = null;
                lastEtaSecRef.current = null;
                setRouteInfo([]);
                if (polylineRef.current) {
                    polylineRef.current.setMap(null);
                    polylineRef.current = null;
                }
                return;
            }
                
            if (!destinationMarker) {
                destinationMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title:"B",
                });
                setHasRoute(true);
                destinationRef.current = clicked; // save destination

                const startTimes = generateStartTimes(); 

                const etaSec = await fetchRoute(
                    originRef.current,
                    destinationRef.current,
                    startTimes,
                    map
                );

                lastEtaSecRef.current = etaSec; // save initial ETA
                return;
            }

            originMarker.map = null;
            destinationMarker.map = null;
            originMarker = new AdvancedMarkerElement({
                map: map,
                position: clicked,
                title:"A",
            });

            originRef.current = clicked;
            destinationMarker = null;
            destinationRef.current = null;
            lastEtaSecRef.current = null;
            setRouteInfo([]);
            setHasRoute(false);
        
        });
    }

    async function fetchRoute(origin,destination,startTimes,map){
        const base = import.meta.env.VITE_API_URL;
        const response = await axios.post(`${base}/api/map/compute-route/`,{
            origin:{latitude:origin.lat,longitude:origin.lng},
            destination:{latitude:destination.lat,longitude:destination.lng},
            startTimes: startTimes,
        });

        console.log("Route response:",response.data);
        let routeInfoArray = [];

        for(let option of response.data){
            drawPolyLine(map,option.polyline);
        
            const distanceKm = formatDistance(option.distance_meters);
            const eta = formatDuration(option.duration);
            const starting_time = formatDate(option.starting_time);
            const arrival_time = formatDate(convertDateToMiliseconds(option.starting_time) + option.duration * 1000);
            routeInfoArray.push({distanceKm,eta,starting_time, arrival_time});
        }
        console.log("Route Info Array inside fetchRoute:", routeInfoArray);
        setRouteInfo(routeInfoArray);

        // return raw seconds so reroute logic can compare
        return response.data.duration;        

    }

    async function drawPolyLine(map,encodedPolyline){
        const maps = await google.maps.importLibrary("geometry");
        const decodedPath = google.maps.geometry.encoding.decodePath(encodedPolyline);

        // remove old polyline if exists
        if (polylineRef.current) {
            polylineRef.current.setMap(null);
        }

        polylineRef.current = new google.maps.Polyline({
            path:decodedPath,
            geodesic: true,
            strokeColor: "#2563eb",
            strokeOpacity: 0.9,
            strokeWeight: 5,
            map,
        });
    }

    function generateStartTimes(){
        const startTimes = [];
        const now = new Date();
        const diffArray = [0, 60, 120, 180, 240]; // minutes from now
        const offsetFromNow = 60000;

        for (const time of diffArray){
            const futureTime = new Date(now.getTime() + time * 60000 + offsetFromNow);
            startTimes.push(futureTime.toISOString());
            console.log("Generated start time:", futureTime.toISOString());
        }
        return startTimes;
    }
    function convertDateToMiliseconds(dateString) {
        const date = new Date(dateString);
        return date.getTime();
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function generateRouteUI(){
        console.log("Route Info Array:", routeInfo);
        routeInfoRows = [];
        for (let i = 0; i < routeInfo.length; i++) {
            routeInfoRows.push(
            <div
                style={{
                backgroundColor: 'white',
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                zIndex: 1001,
                pointerEvents: 'auto',
                }}
            >
            <p style={{ margin: 0, fontWeight: 500 }}>Departure: {routeInfo[i].starting_time}</p>
            <p style={{ margin: 0, fontWeight: 500 }}>Arrival: {routeInfo[i].arrival_time}</p>
            <p style={{ margin: 0, fontWeight: 500 }}>ETA: {routeInfo[i].eta}</p>
        </div>);
        }
    }
    generateRouteUI();

    function formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return "N/A";

        const hrs = Math.floor(seconds / 3600);
        const mins = Math.round((seconds % 3600) / 60);

        if (hrs > 0) return `${hrs} hr ${mins} min`;
        return `${mins} min`;
    }

    function formatDistance(meters) {
        if (!meters || isNaN(meters)) return "N/A";
        return (meters / 1000).toFixed(1); 
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

                <div className="absolute top-4 right-26 z-30">
                    <SpeedTracker speedKmh={speedKmh} />
                </div>

                {/* <button
                onClick={() => setUseMockPath((v) => !v)}
                className="absolute top-4 right-80 z-20 px-3 py-1 bg-white border rounded-lg text-sm shadow"
                >
                {useMockPath ? "Using Mock GPS" : "Using Real GPS"}
                </button> */}
            </div>

            {/* Overlay UI */}
            <div className="overlay-ui" 
            style={{
            pointerEvents: "none"
            }}>  {/* Set pointerEvents to Auto so Google maps doesn't eat all the clicks above the UI region*/}
                <MapPage onSearch={() => console.log("Search triggered!")} />
            </div>

                {/* Route info display */}
            {routeInfo && (<div
                style={{
                position: 'absolute',
                top: '200px',
                left: '120px',
                display: 'flex',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                justifyContent: 'space-between',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 1000,
                pointerEvents: 'auto'
                }}>
                {routeInfo[0]?.distanceKm && (<p style={{ margin: 0, fontWeight: 500, padding: '15px 50px' }}>Distance: {routeInfo[0]?.distanceKm} km</p>)}
                {routeInfoRows}
            </div>)}

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

            <div className="absolute top-24 left-30 z-30 bg-white/90 border rounded-xl p-2 text-xs shadow">
                Route recompute ticks: {rerouteCount}
            </div>

        </div>
    ); 
}