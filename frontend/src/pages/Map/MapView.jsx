import { Component } from "react";
import { User, Award, Settings, LogOut, X, AlertTriangle } from "lucide-react";
import MapComponent from "../../components/MapComponent/MapComponent";
import MapPage from "../../components/MapSideBarComponent/MapSideBarComponent";
import "./Map.css";
import IncidentDetailsCard from "../../components/IncidentDetailsCard/IncidentDetailsCard.jsx";
import SpeedTracker from "../../components/SpeedTracker/SpeedTracker.jsx";
import RouteOptionsComponent from "../../components/RouteOptionsComponent/RouteOptionsComponent.jsx";

export default class MapView extends Component {
    render() {
        const {
            mapData,
            setMarker,
            hasOrigin,
            hasDestination,
            isAToBRef,
            prevLocationRef,
            setUserLocation,
            showNavigationScreen,
            routeInfo,
            navigationIndex,
            showNavEndScreen,
            speedKmh,
            showNavigationEndScreen,
            finishNavigation,
            showAll,
            selectedReport,
            setSelectedReport,
            userLocation,
            setReports,
            isAToBState,
            setIsAToBState,
            isTollRoadsOn,
            toggleTollRoads,
            showTimeSelector,
            showTimeSelectorFunction,
            showRouteOptions,
            availableTimes,
            selectedOffsetMinutes,
            isLoadingRoute,
            handleTimeChange,
            liveNavigateToDestination,
            clearMap,
            showErrorPopup,
            setShowErrorPopup,
            showDropdown,
            setShowDropdown,
            username,
            points,
            handleRewardsClick,
            handleSettingsClick,
            setShowLogoutConfirm,
            showLogoutConfirm,
            handleLogout,
            showSaveMenu,
            toggleSaveMenu,
            closeSaveMenu,
            onSaveOriginPlace,
            onSaveDestinationPlace,
            mapMarkers,
            openSavedDestinations,
            showSavedDestinations,
            isLoadingSavedDestinations,
            savedDestinations,
            closeSavedDestinations,
            selectSavedDestination,
        } = this.props;

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

                {showNavigationScreen && (
                    <>
                        <div className="map-nav-overlay">
                            <h2>Directions</h2>
                            <div className="map-nav-container">
                                <ol>
                                    {routeInfo?.steps?.map((step, index) => (
                                        <li key={index}
                                            className={index === navigationIndex ? "active" : ""}
                                        >
                                            <div>{step?.navigationInstruction.instructions}</div>
                                            <div>{step?.distanceMeters}m</div>
                                            {/* <div>{step?.startLocation.latLng.latitude}</div>
                                            <div>{step?.startLocation.latLng.longitude}</div>
                                            <div>{step?.endLocation.latLng.latitude}</div>
                                            <div>{step?.endLocation.latLng.longitude}</div> */}
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            {/* DEBUGGING MANUALLY CHANGE NAVIGATION INDEX*/}
                            {/* <div className="map-nav-controls">
                                <button
                                    onClick={() => setNavigationIndex((s) => Math.max(s - 1, 0))}
                                    disabled={navigationIndex === 0}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() =>
                                        setNavigationIndex((s) => Math.min(s + 1, routeInfo?.steps.length ?? 0))
                                    }
                                    disabled={navigationIndex === routeInfo?.steps.length ?? 0}
                                >
                                    Next
                                </button>
                            </div> */}

                            <div className="map-nav-end-button">
                                <button
                                    onClick={() => {
                                        showNavEndScreen();
                                    }}
                                    className="map-nav-end-button-inner"
                                >
                                    End Navigation
                                </button>
                            </div>
                        </div>

                        <div className="eta-tracker">
                            <div className="eta-card">
                                <div className="eta-title">ETA</div>
                                <div className="eta-arrival">{routeInfo?.arrival_time ?? "--"}</div>
                                <div className="eta-duration">
                                    {routeInfo?.eta ? `(${routeInfo?.eta} remaining)` : ""}
                                </div>
                            </div>
                        </div>

                        <div className="speed-tracker">
                            <SpeedTracker speedKmh={speedKmh} />
                        </div>
                    </>
                )}

                {showNavigationEndScreen && (
                    <div className="map-nav-end-screen">
                        <h2>Thank you for travelling with us!</h2>
                        <button
                            onClick={() => {
                                finishNavigation();
                            }}
                            className="map-nav-end-screen-button"
                        >
                            Close
                        </button>
                    </div>
                )}

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

                {showAll && (<div>
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
                    {showRouteOptions && (
                        <div className="route-info-container">
                            {/* Route Options */}
                            <div class="route-info-card">
                                <div className="route-info-gradient-bar" />
                                <RouteOptionsComponent 
                                    isTollRoadsOn={isTollRoadsOn} 
                                    toggleTollRoads={toggleTollRoads}>
                                </RouteOptionsComponent>
                            </div>

                            {/* Route Info */}
                            <div className="route-info-card">
                                <div className="route-info-gradient-bar" />

                                {isLoadingRoute && (
                                    <div className="route-info-loading">
                                        <div className="route-info-spinner" />
                                    </div>
                                )}

                                <div className="route-info-header">
                                    <h3 className="route-info-title">
                                        Route Information
                                    </h3>

                                    <button
                                        className="route-info-star-btn"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleSaveMenu();
                                        }}
                                        title="Save places"
                                        type="button"
                                    >
                                        ⭐
                                    </button>
                                </div>

                                {showSaveMenu && (
                                    <div className="route-info-save-menu" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="route-info-save-menu-item"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onSaveOriginPlace();
                                            }}
                                            type="button"
                                            // disabled={!mapMarkers?.origin}
                                            disabled={!hasOrigin}
                                            title={!mapMarkers?.origin ? "Set an origin first" : "Save origin"}
                                        >
                                            Save origin <span className="route-info-star">⭐</span>
                                        </button>

                                        <button
                                            className="route-info-save-menu-item"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                onSaveDestinationPlace();
                                            }}
                                            type="button"
                                            // disabled={!mapMarkers?.destination}
                                            disabled={!hasDestination}
                                            title={!mapMarkers?.destination ? "Set a destination first" : "Save destination"}
                                        >
                                            Save destination <span className="route-info-star">⭐</span>
                                        </button>
                                    </div>
                                )}

                                <div className="route-info-items">
                                    {/* Distance */}
                                    <div className="route-info-item">
                                        <div className="route-info-icon distance">
                                            <span>📍</span>
                                        </div>
                                        <div>
                                            <div className="route-info-label">Distance</div>
                                            <div className="route-info-value">
                                                {routeInfo?.distanceKm ?? "N/A"} <span className="route-info-unit">km</span>
                                            </div>
                                        </div>
                                    </div>

                                    {mapMarkers?.origin && (
                                        <button
                                            className="route-info-save-btn"
                                            onClick={onSaveOriginPlace}
                                            title="Save Start (A)"
                                        >
                                            ⭐
                                        </button>
                                    )}

                                    {/* Departure Time */}
                                    <div className="route-info-item">
                                        <div className="route-info-icon departure">
                                            <span>🚗</span>
                                        </div>
                                        <div>
                                            <div className="route-info-label">Departure</div>
                                            <div className="route-info-value">{routeInfo?.starting_time ?? "N/A"}</div>
                                        </div>
                                    </div>

                                    {/* ETA */}
                                    <div className="route-info-item">
                                        <div className="route-info-icon duration">
                                            <span>🕒</span>
                                        </div>
                                        <div>
                                            <div className="route-info-label">ETA</div>
                                            <div className="route-info-value">{routeInfo?.arrival_time ?? "N/A"}</div>
                                        </div>
                                    </div>

                                    {/* Duration */}
                                    <div className="route-info-item">
                                        <div className="route-info-icon duration">
                                            <span>⏱️</span>
                                        </div>
                                        <div>
                                            <div className="route-info-label">Travel Time</div>
                                            <div className="route-info-value">{routeInfo?.eta ?? "N/A"}</div>
                                        </div>
                                    </div>

                                    {/* Directions */}
                                    <button className="route-time-select-item" onClick={showTimeSelectorFunction}>
                                        <div className="route-info-icon">
                                            <span>⌚</span>
                                        </div>
                                        <div>
                                            <div className="route-info-value">Choose a time</div>
                                        </div>
                                    </button>

                                    {/* Directions */}
                                    <button className="route-info-directions-item" onClick={liveNavigateToDestination}>
                                        <div className="route-info-icon">
                                            <span>🗺️</span>
                                        </div>
                                        <div>
                                            <div className="route-info-value">Directions {"->"}</div>
                                        </div>
                                    </button>

                                    {/* Saved Destinations */}
                                    <button className="route-info-saved-item" onClick={openSavedDestinations}>
                                        <div className="route-info-icon">
                                            <span>🔖</span>
                                        </div>
                                        <div>
                                            <div className="route-info-value">Saved destinations</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {showSavedDestinations && (
                                <div className="saved-destinations-overlay" onClick={closeSavedDestinations}>
                                    <div className="route-info-card saved-destinations-card" onClick={(e) => e.stopPropagation()}>
                                        <div className="route-info-gradient-bar" />
                                    
                                        <div className="saved-destinations-header">
                                            <h3>Saved destinations</h3>
                                            <button className="saved-destinations-close" onClick={closeSavedDestinations}>✕</button>
                                        </div>

                                        {isLoadingSavedDestinations ? (
                                            <div className="saved-destinations-loading">Loading...</div>
                                        ) : (
                                            <div className="saved-destinations-list">
                                            {savedDestinations?.length ? savedDestinations.map((d) => (
                                                <button
                                                key={d.id}
                                                className="saved-destinations-item"
                                                onClick={() => selectSavedDestination(d)}
                                                >
                                                <div className="saved-destinations-title">{d.label}</div>
                                                <div className="saved-destinations-sub">
                                                    {d.address?.trim()
                                                        ? d.address
                                                        : `${Number(d.latitude).toFixed(5)}, ${Number(d.longitude).toFixed(5)}`}
                                                </div>
                                                </button>
                                            )) : (
                                                <div className="saved-destinations-empty">No saved destinations yet.</div>
                                            )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
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
                )}
            </div>
        );
    }
}
