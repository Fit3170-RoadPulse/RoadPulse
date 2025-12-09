import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { User, Award, Settings, LogOut } from "lucide-react";
import MapComponent from "../components/map-component";
import MapPage from "../pages/mappage/MapPage";
import "../pages/mappage/MapPage.css";
import RewardsPage from "../pages/rewardspage/RewardsPage";


function Map() {
    const [mapData, setMapData] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [points] = useState(1000); // Replace with actual user points
    const navigate = useNavigate();

    useEffect(() => {
        const base = import.meta.env.VITE_API_URL || "";
        axios.get(`${base}/api/map/`).then((r) => setMapData(r.data));
    }, []);

    const handleRewardsClick = () => {
        setShowDropdown(false);
        navigate("/rewards-page"); // Navigate to rewards page
    };

    const handleSettingsClick = () => {
        setShowDropdown(false);
        navigate("/setting-menu-page"); // Navigate to settings page
    };

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
                <MapComponent API_KEY={mapData?.GMAPS_KEY} />
                <MapComponent MAP_ID={mapData?.GMAPS_ID} />
            </div>

            {/* Overlay UI */}
            <div className="overlay-ui"
                style={{
                    pointerEvents: "none"
                }}>
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

export default Map;