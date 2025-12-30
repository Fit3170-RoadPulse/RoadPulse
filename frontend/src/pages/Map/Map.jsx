import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { User, Award, Settings, LogOut, X, AlertTriangle } from "lucide-react";
import MapComponent from "../../components/MapComponent/MapComponent";
import MapPage from "../../components/MapSideBarComponent/MapSideBarComponent";
import "./Map.css"
import RewardsPage from "../rewardspage/RewardsPage";

export default function Map() {
    let [mapData, setMapData] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [points] = useState(1000); // Replace with actual user points
    const navigate = useNavigate();
    const [routeInfo, setRouteInfo] = useState(null); // Changed to single route object
    const [mapMarkers, setMapMarkers] = useState({ origin: null, destination: null });
    const [mapPolylines, setMapPolylines] = useState([]);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [selectedTimeIndex, setSelectedTimeIndex] = useState(0);
    const [showTimeSelector, setShowTimeSelector] = useState(false);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [mapRef, setMapRef] = useState(null);
    const [showErrorPopup, setShowErrorPopup] = useState(false);

    useEffect(() => {
        const base = import.meta.env.VITE_API_URL || "";
        axios.get(`${base}/api/map/`).then((r) => {
            setMapData(r.data)
        });
    }, []);
    console.log(mapData);

    const handleRewardsClick = () => {
        setShowDropdown(false);
        navigate("/rewards-page"); // Navigate to rewards page
    };

    const handleSettingsClick = () => {
        setShowDropdown(false);
        navigate("/setting-menu-page"); // Navigate to settings page
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
        setSelectedTimeIndex(0);
    };


    async function setMarker(map) {
        // Store map reference for later use
        setMapRef(map);

        let originMarker = mapMarkers.origin;
        let destinationMarker = mapMarkers.destination;
        //let directionsRenderer = null;
        let trafficLayer = null;

        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
        trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);

        //directionsRenderer = new google.maps.DirectionsRenderer();
        //directionsRenderer.setMap(map);

        map.addListener("click", (e) => {
            const clicked = { lat: e.latLng.lat(), lng: e.latLng.lng() };

            if (!originMarker) {
                originMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title: "A",
                });
                setMapMarkers({ origin: originMarker, destination: null });

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
                setSelectedTimeIndex(0);
                setShowTimeSelector(true);

                // Fetch route for first time option
                fetchRoute(originMarker.position, destinationMarker.position, times[0].time, map);
            } else {
                // Clear previous markers
                originMarker.map = null;
                destinationMarker.map = null;

                // Clear all previous polylines from the MAP using the STATE via callback
                setMapPolylines(currentPolylines => {
                    currentPolylines.forEach(polyline => polyline.setMap(null));
                    return []; // Return empty array to clear state
                });

                // Clear route info and time selector
                setRouteInfo(null);
                setShowTimeSelector(false);
                setAvailableTimes([]);
                setSelectedTimeIndex(0);

                // Start new route
                originMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title: "A",
                });
                destinationMarker = null;
                setMapMarkers({ origin: originMarker, destination: null });
            }
        });
    }

    const handleTimeChange = async (index) => {
        if (!mapMarkers.origin || !mapMarkers.destination || !availableTimes[index] || !mapRef) return;

        // Get the selected time before refreshing
        const selectedTime = availableTimes[index].time;

        setIsLoadingRoute(true);

        // Clear existing polylines from map
        mapPolylines.forEach(polyline => polyline.setMap(null));

        // Clear polylines state immediately
        setMapPolylines([]);

        // Fetch new route for selected time
        await fetchRoute(mapMarkers.origin.position, mapMarkers.destination.position, selectedTime, mapRef);

        // Regenerate time slots based on CURRENT time for next selection
        const refreshedTimes = generateStartTimes();
        setAvailableTimes(refreshedTimes);

        // Find which index in the new times is closest to the selected time
        // This keeps the same selection highlighted after refresh
        const selectedDate = new Date(selectedTime);
        let closestIndex = 0;
        let minDiff = Infinity;

        refreshedTimes.forEach((timeSlot, i) => {
            const diff = Math.abs(new Date(timeSlot.time) - selectedDate);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        });

        setSelectedTimeIndex(closestIndex);
    };

    async function fetchRoute(origin, destination, selectedTime, map) {
        setIsLoadingRoute(true);
        const base = import.meta.env.VITE_API_URL;

        try {
            const response = await axios.post(`${base}/api/map/compute-route/`, {
                origin: { latitude: origin.lat, longitude: origin.lng },
                destination: { latitude: destination.lat, longitude: destination.lng },
                startTimes: [selectedTime], // Send as array with single time
            });

            console.log("Route response:", response.data);

            if (response.data && response.data.length > 0) {
                const routeData = response.data[0];
                const polyline = await drawPolyLine(map, routeData.polyline);

                // Update polylines state via callback to get current value
                setMapPolylines(currentPolylines => {
                    return [...currentPolylines, polyline];
                });

                const distanceKm = formatDistance(routeData.distance_meters);
                const eta = formatDuration(routeData.duration);
                const starting_time = formatDate(routeData.starting_time);

                setRouteInfo({
                    distanceKm,
                    eta,
                    starting_time,
                    distance_meters: routeData.distance_meters,
                    duration: routeData.duration
                });
            }
        } catch (error) {
            console.error("Error fetching route:", error);
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
                time: futureTime.toISOString(),
                label: i === 0 ? 'Now' : `+${offsetMinutes} min`,
                displayTime: `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`,
                offsetMinutes: offsetMinutes
            });
        }
        return times;
    }

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

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                <MapComponent API_KEY={mapData?.GMAPS_KEY} MAP_ID={mapData?.GMAPS_ID} map_function={setMarker} />
            </div>

            {/* Overlay UI */}
            <div className="overlay-ui"
                style={{
                    pointerEvents: "none"
                }}>  {/* Set pointerEvents to Auto so Google maps doesn't eat all the clicks above the UI region*/}
                <MapPage onSearch={() => console.log("Search triggered!")} />
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
                                    className={`time-slot-button ${selectedTimeIndex === index ? 'selected' : ''}`}
                                >
                                    <div className="time-slot-info">
                                        <div className="time-slot-display-time">
                                            {timeSlot.displayTime}
                                        </div>
                                        <div className="time-slot-label">
                                            {timeSlot.label}
                                        </div>
                                    </div>
                                    {selectedTimeIndex === index && (
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
                )
            }

        </div >
    );
}