import { Component } from "react";
import { User, Award, Settings, LogOut, X, AlertTriangle } from "lucide-react";
import MapComponent from "../../components/MapComponent/MapComponent";
import MapPage from "../../components/MapSideBarComponent/MapSideBarComponent";
import "./Map.css";
import IncidentDetailsCard from "../../components/IncidentDetailsCard/IncidentDetailsCard.jsx";
import SpeedTracker from "../../components/SpeedTracker/SpeedTracker.jsx";
import RouteOptionsComponent from "../../components/RouteOptionsComponent/RouteOptionsComponent.jsx";
import NavigationDirectionsList from "../../components/NavigationOverlay/NavigationDirectionsList";


export default class MapView extends Component {
    state = {
        routeSheetHeightVh: 38,
        incidentSheetHeightVh: 42,
    };
    lastViewportInsets = null;
    freezeViewportInsets = false;
    baseBrowserBottomInset = 0;
    savePlaceInputFocused = false;
    searchInputFocused = false;
    mapInputLockActive = false;
    viewportSyncTimeout = null;

    componentDidMount = () => {
        this.syncTimeSelectorClass();
        this.syncSavePlaceClass();
        if (typeof document !== "undefined") {
            document.body.classList.add("rp-map-page");
            document.documentElement.classList.add("rp-map-page");
        }
        if (typeof window !== "undefined") {
            window.scrollTo(0, 0);
        }
        this.updateMobileViewportVars();
        this.bindViewportListeners();
    };

    componentDidUpdate = (prevProps) => {
        if (prevProps.showRouteOptions && !this.props.showRouteOptions && this.state.routeSheetHeightVh !== 38) {
            this.setState({ routeSheetHeightVh: 38 });
        }
        if (prevProps.selectedReport && !this.props.selectedReport && this.state.incidentSheetHeightVh !== 42) {
            this.setState({ incidentSheetHeightVh: 42 });
        }
        if (prevProps.showTimeSelector !== this.props.showTimeSelector) {
            this.syncTimeSelectorClass();
        }
        if (prevProps.savePlaceModalOpen !== this.props.savePlaceModalOpen) {
            this.syncSavePlaceClass();
            if (!this.props.savePlaceModalOpen) {
                this.savePlaceInputFocused = false;
                this.updateMobileViewportVars();
            }
        }
    };

    componentWillUnmount = () => {
        document.body.classList.remove("rp-time-selector-open");
        document.body.classList.remove("rp-save-place-open");
        document.body.classList.remove("rp-route-dragging");
        document.body.classList.remove("rp-incident-dragging");
        document.body.classList.remove("rp-map-page");
        document.documentElement.classList.remove("rp-map-page");
        document.body.classList.remove("rp-map-input-lock");
        document.body.classList.remove("rp-map-keyboard-open");
        this.savePlaceInputFocused = false;
        this.searchInputFocused = false;
        this.freezeViewportInsets = false;
        this.mapInputLockActive = false;
        if (this.viewportSyncTimeout) {
            clearTimeout(this.viewportSyncTimeout);
            this.viewportSyncTimeout = null;
        }
        this.unbindViewportListeners();
        this.resetMobileViewportVars();
        window.removeEventListener("pointermove", this.handleIncidentPointerMove);
        window.removeEventListener("pointerup", this.handleIncidentPointerUp);
        window.removeEventListener("pointercancel", this.handleIncidentPointerUp);
        window.removeEventListener("touchmove", this.handleIncidentTouchMove);
        window.removeEventListener("touchend", this.handleIncidentTouchEnd);
        window.removeEventListener("touchcancel", this.handleIncidentTouchEnd);
    };

    syncTimeSelectorClass = () => {
        if (this.props.showTimeSelector) {
            document.body.classList.add("rp-time-selector-open");
        } else {
            document.body.classList.remove("rp-time-selector-open");
        }
    };

    syncSavePlaceClass = () => {
        if (typeof document === "undefined") return;
        const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
        if (this.props.savePlaceModalOpen && isMobile) {
            document.body.classList.add("rp-save-place-open");
        } else {
            document.body.classList.remove("rp-save-place-open");
        }
    };

    updateMobileViewportVars = () => {
        if (typeof window === "undefined" || typeof document === "undefined") return;
        const body = document.body;
        const isMobile = window.innerWidth <= 768;
        const vv = window.visualViewport;

        if (!isMobile || !vv) {
            body.style.removeProperty("--mobile-browser-ui-top");
            body.style.setProperty("--mobile-browser-ui-bottom", "0px");
            this.lastViewportInsets = { top: 0, bottom: 0 };
            this.freezeViewportInsets = false;
            this.mapInputLockActive = false;
            body.classList.remove("rp-map-input-lock");
            body.classList.remove("rp-map-keyboard-open");
            this.syncSavePlaceClass();
            return;
        }

        const offsetTop = Math.max(0, vv.offsetTop || 0);
        const rawBottomInset = Math.max(0, window.innerHeight - (vv.height + offsetTop));
        if (rawBottomInset <= 80) {
            this.baseBrowserBottomInset = rawBottomInset;
        }
        const inputFocused = this.savePlaceInputFocused || this.searchInputFocused;
        const keyboardOpen = inputFocused && rawBottomInset > (this.baseBrowserBottomInset + 80);
        const bottomInset = keyboardOpen ? rawBottomInset : this.baseBrowserBottomInset;
        const nextInsets = { top: offsetTop, bottom: bottomInset };
        const shouldFreeze = keyboardOpen;
        this.freezeViewportInsets = shouldFreeze;
        this.mapInputLockActive = shouldFreeze;
        if (shouldFreeze) {
            body.classList.add("rp-map-input-lock");
        } else {
            body.classList.remove("rp-map-input-lock");
        }
        if (keyboardOpen) {
            body.classList.add("rp-map-keyboard-open");
        } else {
            body.classList.remove("rp-map-keyboard-open");
        }

        if (!this.lastViewportInsets) {
            this.lastViewportInsets = nextInsets;
        }

        const appliedInsets = shouldFreeze ? this.lastViewportInsets : nextInsets;
        if (!shouldFreeze) {
            this.lastViewportInsets = nextInsets;
        }

        if (appliedInsets.top > 0) {
            body.style.setProperty("--mobile-browser-ui-top", `${appliedInsets.top}px`);
        } else {
            body.style.removeProperty("--mobile-browser-ui-top");
        }
        body.style.setProperty("--mobile-browser-ui-bottom", `${appliedInsets.bottom}px`);
        this.syncSavePlaceClass();
    };

    resetMobileViewportVars = () => {
        if (typeof document === "undefined") return;
        document.body.style.removeProperty("--mobile-browser-ui-top");
        document.body.style.removeProperty("--mobile-browser-ui-bottom");
    };

    bindViewportListeners = () => {
        if (typeof window === "undefined") return;
        const vv = window.visualViewport;
        if (vv) {
            vv.addEventListener("resize", this.updateMobileViewportVars);
            vv.addEventListener("scroll", this.updateMobileViewportVars);
        }
        window.addEventListener("resize", this.updateMobileViewportVars);
        window.addEventListener("orientationchange", this.updateMobileViewportVars);
    };

    unbindViewportListeners = () => {
        if (typeof window === "undefined") return;
        const vv = window.visualViewport;
        if (vv) {
            vv.removeEventListener("resize", this.updateMobileViewportVars);
            vv.removeEventListener("scroll", this.updateMobileViewportVars);
        }
        window.removeEventListener("resize", this.updateMobileViewportVars);
        window.removeEventListener("orientationchange", this.updateMobileViewportVars);
    };

    scheduleViewportSync = () => {
        if (typeof window === "undefined") return;
        if (this.viewportSyncTimeout) {
            clearTimeout(this.viewportSyncTimeout);
        }
        this.viewportSyncTimeout = window.setTimeout(() => {
            this.updateMobileViewportVars();
        }, 150);
    };

    setMapInputFocus = (type, isFocused) => {
        if (type === "savePlace") {
            this.savePlaceInputFocused = isFocused;
        } else if (type === "search") {
            this.searchInputFocused = isFocused;
        }
        this.updateMobileViewportVars();
        this.scheduleViewportSync();
    };

    handleSavePlaceInputFocus = () => {
        this.setMapInputFocus("savePlace", true);
    };

    handleSavePlaceInputBlur = () => {
        this.setMapInputFocus("savePlace", false);
    };

    handleSearchInputFocus = () => {
        this.setMapInputFocus("search", true);
    };

    handleSearchInputBlur = () => {
        this.setMapInputFocus("search", false);
    };

    routeDragActive = false;
    routeDragStartY = 0;
    routeDragStartHeight = 38;
    routeDragRaf = null;
    routeDragPointerType = null;
    incidentDragActive = false;
    incidentDragStartY = 0;
    incidentDragStartHeight = 42;
    incidentDragRaf = null;

    setRouteSheetHeight = (nextHeight) => {
        if (this.routeDragRaf) cancelAnimationFrame(this.routeDragRaf);
        this.routeDragRaf = requestAnimationFrame(() => {
            this.setState({ routeSheetHeightVh: nextHeight });
        });
    };

    setIncidentSheetHeight = (nextHeight) => {
        if (this.incidentDragRaf) cancelAnimationFrame(this.incidentDragRaf);
        this.incidentDragRaf = requestAnimationFrame(() => {
            this.setState({ incidentSheetHeightVh: nextHeight });
        });
    };

    startRouteDrag = (clientY, pointerType = "pointer") => {
        this.routeDragActive = true;
        this.routeDragStartY = clientY;
        this.routeDragStartHeight = this.state.routeSheetHeightVh;
        this.routeDragPointerType = pointerType;
        document.body.classList.add("rp-route-dragging");
    };

    startIncidentDrag = (clientY) => {
        this.incidentDragActive = true;
        this.incidentDragStartY = clientY;
        this.incidentDragStartHeight = this.state.incidentSheetHeightVh;
        document.body.classList.add("rp-incident-dragging");
    };

    handleRoutePointerDown = (event) => {
        if (this.mapInputLockActive) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.pointerId != null && event.currentTarget?.setPointerCapture) {
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        const clientY = event.clientY;
        this.startRouteDrag(clientY, event.pointerType || "pointer");
        window.addEventListener("pointermove", this.handleRoutePointerMove, { passive: false });
        window.addEventListener("pointerup", this.handleRoutePointerUp);
        window.addEventListener("pointercancel", this.handleRoutePointerUp);
    };

    handleIncidentPointerDown = (event) => {
        if (this.mapInputLockActive) return;
        event.preventDefault();
        event.stopPropagation();
        if (event.pointerId != null && event.currentTarget?.setPointerCapture) {
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        const clientY = event.clientY;
        this.startIncidentDrag(clientY);
        window.addEventListener("pointermove", this.handleIncidentPointerMove, { passive: false });
        window.addEventListener("pointerup", this.handleIncidentPointerUp);
        window.addEventListener("pointercancel", this.handleIncidentPointerUp);
    };

    handleRouteSheetPointerDown = (event) => {
        if (window.innerWidth > 768) return;
        if (this.mapInputLockActive) return;
        if (!event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const offsetY = event.clientY - rect.top;
        if (offsetY > 44) return;
        this.handleRoutePointerDown(event);
    };

    handleIncidentSheetPointerDown = (event) => {
        if (window.innerWidth > 768) return;
        if (this.mapInputLockActive) return;
        if (event.target?.closest?.(".incident-close-btn")) return;
        if (!event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const offsetY = event.clientY - rect.top;
        if (offsetY > 120) return;
        this.handleIncidentPointerDown(event);
    };

    handleRoutePointerMove = (event) => {
        if (!this.routeDragActive) return;
        if (event.cancelable) {
            event.preventDefault();
        }
        event.stopPropagation();
        const clientY = event.clientY;
        const deltaY = this.routeDragStartY - clientY;
        const deltaVh = (deltaY / window.innerHeight) * 100;
        const minVh = 32;
        const maxVh = 78;
        const nextHeight = Math.min(maxVh, Math.max(minVh, this.routeDragStartHeight + deltaVh));
        this.setRouteSheetHeight(nextHeight);
    };

    handleIncidentPointerMove = (event) => {
        if (!this.incidentDragActive) return;
        if (event.cancelable) {
            event.preventDefault();
        }
        event.stopPropagation();
        const clientY = event.clientY;
        const deltaY = this.incidentDragStartY - clientY;
        const deltaVh = (deltaY / window.innerHeight) * 100;
        const minVh = 32;
        const maxVh = 78;
        const nextHeight = Math.min(maxVh, Math.max(minVh, this.incidentDragStartHeight + deltaVh));
        this.setIncidentSheetHeight(nextHeight);
    };

    handleRoutePointerUp = () => {
        if (!this.routeDragActive) return;
        this.routeDragActive = false;
        window.removeEventListener("pointermove", this.handleRoutePointerMove);
        window.removeEventListener("pointerup", this.handleRoutePointerUp);
        window.removeEventListener("pointercancel", this.handleRoutePointerUp);
        document.body.classList.remove("rp-route-dragging");
        const minVh = 32;
        const maxVh = 78;
        const midpoint = (minVh + maxVh) / 2;
        const target = this.state.routeSheetHeightVh >= midpoint ? maxVh : minVh;
        this.setRouteSheetHeight(target);
        this.routeDragPointerType = null;
    };

    handleIncidentPointerUp = () => {
        if (!this.incidentDragActive) return;
        this.incidentDragActive = false;
        window.removeEventListener("pointermove", this.handleIncidentPointerMove);
        window.removeEventListener("pointerup", this.handleIncidentPointerUp);
        window.removeEventListener("pointercancel", this.handleIncidentPointerUp);
        document.body.classList.remove("rp-incident-dragging");
        const minVh = 32;
        const maxVh = 78;
        const midpoint = (minVh + maxVh) / 2;
        const target = this.state.incidentSheetHeightVh >= midpoint ? maxVh : minVh;
        this.setIncidentSheetHeight(target);
    };

    handleRouteTouchStart = (event) => {
        if (this.routeDragActive) return;
        if (this.mapInputLockActive) return;
        event.preventDefault();
        event.stopPropagation();
        const clientY = event.touches?.[0]?.clientY;
        if (typeof clientY !== "number") return;
        this.startRouteDrag(clientY, "touch");
        window.addEventListener("touchmove", this.handleRouteTouchMove, { passive: false });
        window.addEventListener("touchend", this.handleRouteTouchEnd);
        window.addEventListener("touchcancel", this.handleRouteTouchEnd);
    };

    handleIncidentTouchStart = (event) => {
        if (this.incidentDragActive) return;
        if (this.mapInputLockActive) return;
        event.preventDefault();
        event.stopPropagation();
        const clientY = event.touches?.[0]?.clientY;
        if (typeof clientY !== "number") return;
        this.startIncidentDrag(clientY);
        window.addEventListener("touchmove", this.handleIncidentTouchMove, { passive: false });
        window.addEventListener("touchend", this.handleIncidentTouchEnd);
        window.addEventListener("touchcancel", this.handleIncidentTouchEnd);
    };

    handleRouteSheetTouchStart = (event) => {
        if (window.innerWidth > 768) return;
        if (this.mapInputLockActive) return;
        if (!event.currentTarget) return;
        const clientY = event.touches?.[0]?.clientY;
        if (typeof clientY !== "number") return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (clientY - rect.top > 44) return;
        this.handleRouteTouchStart(event);
    };

    handleIncidentSheetTouchStart = (event) => {
        if (window.innerWidth > 768) return;
        if (this.mapInputLockActive) return;
        if (event.target?.closest?.(".incident-close-btn")) return;
        if (!event.currentTarget) return;
        const clientY = event.touches?.[0]?.clientY;
        if (typeof clientY !== "number") return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (clientY - rect.top > 120) return;
        this.handleIncidentTouchStart(event);
    };

    handleTimeSlotSelect = (index) => {
        const { handleTimeChange, showTimeSelectorFunction } = this.props;
        handleTimeChange(index);
        if (window.innerWidth <= 768) {
            showTimeSelectorFunction();
        }
    };

    handleRouteTouchMove = (event) => {
        if (!this.routeDragActive) return;
        event.preventDefault();
        const clientY = event.touches?.[0]?.clientY;
        if (typeof clientY !== "number") return;
        const deltaY = this.routeDragStartY - clientY;
        const deltaVh = (deltaY / window.innerHeight) * 100;
        const minVh = 32;
        const maxVh = 78;
        const nextHeight = Math.min(maxVh, Math.max(minVh, this.routeDragStartHeight + deltaVh));
        this.setRouteSheetHeight(nextHeight);
    };

    handleIncidentTouchMove = (event) => {
        if (!this.incidentDragActive) return;
        event.preventDefault();
        const clientY = event.touches?.[0]?.clientY;
        if (typeof clientY !== "number") return;
        const deltaY = this.incidentDragStartY - clientY;
        const deltaVh = (deltaY / window.innerHeight) * 100;
        const minVh = 32;
        const maxVh = 78;
        const nextHeight = Math.min(maxVh, Math.max(minVh, this.incidentDragStartHeight + deltaVh));
        this.setIncidentSheetHeight(nextHeight);
    };

    handleRouteTouchEnd = () => {
        this.handleRoutePointerUp();
        window.removeEventListener("touchmove", this.handleRouteTouchMove);
        window.removeEventListener("touchend", this.handleRouteTouchEnd);
        window.removeEventListener("touchcancel", this.handleRouteTouchEnd);
    };

    handleIncidentTouchEnd = () => {
        this.handleIncidentPointerUp();
        window.removeEventListener("touchmove", this.handleIncidentTouchMove);
        window.removeEventListener("touchend", this.handleIncidentTouchEnd);
        window.removeEventListener("touchcancel", this.handleIncidentTouchEnd);
    };

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
            errorPopup,
            setErrorPopup,
            savePlaceModalOpen,
            savePlaceType,
            savePlaceLabel,
            savePlaceError,
            isSavingPlace,
            onSavePlaceLabelChange,
            onSavePlaceCancel,
            onSavePlaceConfirm,
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
            deletingDestinationId,
            onDeleteSavedDestination,
            onPlaceSelected,
            onRecenterRequest,
        } = this.props;
        const { routeSheetHeightVh, incidentSheetHeightVh } = this.state;
        const isMobileView = typeof window !== "undefined" && window.innerWidth <= 768;
        const showSavedDestinationsSheet = showSavedDestinations && isMobileView;
        const showRouteSheet = showRouteOptions || showSavedDestinationsSheet;
        const showSavePlaceSheet = savePlaceModalOpen && isMobileView;

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
                        onRecenterRequest={onRecenterRequest}
                        onSavedDestinationsClick={openSavedDestinations}
                    />
                </div>

                {showNavigationScreen && (
                    <>
                        <div className="map-nav-overlay">
                            <div className="map-nav-container">
                                <NavigationDirectionsList
                                    steps={routeInfo?.steps}
                                    currentStepIndex={navigationIndex}
                                    speed={speedKmh}
                                    eta={routeInfo?.arrival_time}
                                    onEndNavigation={showNavEndScreen}
                                />
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

                            <div className="desktop-only-nav-elements">
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
                        </div>

                        <div className="desktop-only-nav-elements">
                            <div className="eta-tracker">
                                <div className="eta-card">
                                    <div className="eta-info">
                                        <div className="eta-title">ETA</div>
                                        <div className="eta-arrival">{routeInfo?.arrival_time ?? "--"}</div>
                                        <div className="eta-duration">
                                            {routeInfo?.eta ? `(${routeInfo?.eta} remaining)` : ""}
                                        </div>
                                    </div>
                                    <button
                                        className="eta-end-button"
                                        onClick={() => {
                                            showNavEndScreen();
                                        }}
                                    >
                                        End Navigation
                                    </button>
                                </div>
                            </div>

                            <div className="speed-tracker">
                                <SpeedTracker speedKmh={speedKmh} />
                            </div>
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
                <div className="map-overlay-ui">
                    <MapPage
                        onSearch={() => console.log("Search triggered!")}
                        onPlaceSelected={onPlaceSelected}
                        showRouteUI={showRouteOptions || showSavedDestinations}
                        userLocation={userLocation}
                        mapData={mapData}
                        onSearchInputFocus={this.handleSearchInputFocus}
                        onSearchInputBlur={this.handleSearchInputBlur}
                        onSavedDestinationsClick={openSavedDestinations}
                    />
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
                                <div
                                    className="map-incident-sheet"
                                    style={{ "--incident-sheet-height": `${incidentSheetHeightVh}vh` }}
                                    onPointerDown={this.handleIncidentSheetPointerDown}
                                    onTouchStart={this.handleIncidentSheetTouchStart}
                                >
                                    <button
                                        type="button"
                                        className="map-incident-handle"
                                        onPointerDown={this.handleIncidentPointerDown}
                                        onTouchStart={this.handleIncidentTouchStart}
                                        aria-label="Drag to resize incident details"
                                    />
                                    <div className="map-incident-scroll">
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
                                    </div>
                                </div>
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
                                            onClick={() => this.handleTimeSlotSelect(index)}
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

                    {/* Mobile Time Picker Sheet */}
                    {showTimeSelector && (
                        <div
                            className="time-picker-sheet-container"
                            style={{ "--route-sheet-height": `${routeSheetHeightVh}vh` }}
                        >
                            <div
                                className="route-info-sheet time-picker-sheet"
                                onPointerDown={this.handleRouteSheetPointerDown}
                                onTouchStart={this.handleRouteSheetTouchStart}
                            >
                                <button
                                    type="button"
                                    className="time-picker-back"
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onTouchStart={(event) => event.stopPropagation()}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        showTimeSelectorFunction();
                                    }}
                                    aria-label="Back to route details"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="route-info-handle"
                                    aria-label="Drag to resize time picker"
                                />
                                <div className="route-info-scroll">
                                    <div className="route-info-card time-picker-card">
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
                                                    onClick={() => this.handleTimeSlotSelect(index)}
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
                            </div>
                        </div>
                    )}

                    {/* Mobile Save Place Sheet */}
                    {showSavePlaceSheet && (
                        <div
                            className="save-place-sheet-container"
                            style={{ "--route-sheet-height": `${routeSheetHeightVh}vh` }}
                        >
                            <div
                                className="route-info-sheet save-place-sheet"
                                onPointerDown={this.handleRouteSheetPointerDown}
                                onTouchStart={this.handleRouteSheetTouchStart}
                            >
                                <button
                                    type="button"
                                    className="time-picker-back"
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onTouchStart={(event) => event.stopPropagation()}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onSavePlaceCancel();
                                    }}
                                    aria-label="Back to route details"
                                >
                                    Back
                                </button>
                                <button
                                    type="button"
                                    className="route-info-handle"
                                    aria-label="Drag to resize save place sheet"
                                />
                                <div className="route-info-scroll">
                                    <div className="route-info-card">
                                        <div className="save-place-card">
                                            <div className="save-place-header">
                                                <h3>Save {savePlaceType || "place"}</h3>
                                            </div>
                                            <label className="save-place-label" htmlFor="save-place-input-sheet">
                                                Name this {savePlaceType ? savePlaceType.toLowerCase() : "place"}
                                            </label>
                                            <input
                                                id="save-place-input-sheet"
                                                className={`save-place-input ${savePlaceError ? "has-error" : ""}`}
                                                value={savePlaceLabel}
                                                onFocus={this.handleSavePlaceInputFocus}
                                                onBlur={this.handleSavePlaceInputBlur}
                                                onChange={(e) => onSavePlaceLabelChange(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        onSavePlaceConfirm();
                                                    }
                                                }}
                                                placeholder="e.g. Home, Office"
                                                maxLength={80}
                                                autoFocus
                                            />
                                            {savePlaceError && (
                                                <div className="save-place-error">{savePlaceError}</div>
                                            )}
                                            <div className="save-place-actions">
                                                <button
                                                    type="button"
                                                    className="save-place-btn ghost"
                                                    onClick={onSavePlaceCancel}
                                                    disabled={isSavingPlace}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    className="save-place-btn primary"
                                                    onClick={onSavePlaceConfirm}
                                                    disabled={isSavingPlace || !savePlaceLabel?.trim()}
                                                >
                                                    {isSavingPlace ? "Saving..." : "Save"}
                                                </button>
                                            </div>
                                            <div className="save-place-hint">Up to 80 characters.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modern Route Info Card */}
                    {showRouteSheet && (
                        <div
                            className="route-info-container"
                            style={{ "--route-sheet-height": `${routeSheetHeightVh}vh` }}
                        >
                            <div
                                className="route-info-sheet"
                                onPointerDown={this.handleRouteSheetPointerDown}
                                onTouchStart={this.handleRouteSheetTouchStart}
                            >
                                <button
                                    type="button"
                                    className="route-info-close"
                                    onPointerDown={(event) => event.stopPropagation()}
                                    onTouchStart={(event) => event.stopPropagation()}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        clearMap();
                                    }}
                                    aria-label="Close route details"
                                >
                                    ×
                                </button>
                                <button
                                    type="button"
                                    className="route-info-handle"
                                    aria-label="Drag to resize route details"
                                />

                                <div className="route-info-scroll">
                                    {showSavedDestinationsSheet ? (
                                        <div className="route-info-card saved-destinations-sheet">
                                            <div className="route-info-gradient-bar" />
                                            <div className="saved-destinations-mobile-header">
                                                <h3>Saved destinations</h3>
                                            </div>

                                            {isLoadingSavedDestinations ? (
                                                <div className="saved-destinations-loading">Loading...</div>
                                            ) : (
                                                <div className="saved-destinations-list">
                                                    {savedDestinations?.length ? savedDestinations.map((d) => (
                                                        <div
                                                            key={d.id}
                                                            className="saved-destinations-item"
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => selectSavedDestination(d)}
                                                            onKeyDown={(event) => {
                                                                if (event.key === "Enter" || event.key === " ") {
                                                                    event.preventDefault();
                                                                    selectSavedDestination(d);
                                                                }
                                                            }}
                                                        >
                                                            <div className="saved-destinations-item-header">
                                                                <div className="saved-destinations-title">{d.label}</div>
                                                                <button
                                                                    type="button"
                                                                    className="saved-destinations-remove"
                                                                    onClick={(event) => {
                                                                        event.preventDefault();
                                                                        event.stopPropagation();
                                                                        onDeleteSavedDestination(d.id);
                                                                    }}
                                                                    disabled={deletingDestinationId === d.id}
                                                                    title="Remove saved destination"
                                                                >
                                                                    {deletingDestinationId === d.id ? "Removing..." : "Remove"}
                                                                </button>
                                                            </div>
                                                            <div className="saved-destinations-sub">
                                                                {d.address?.trim()
                                                                    ? d.address
                                                                    : `${Number(d.latitude).toFixed(5)}, ${Number(d.longitude).toFixed(5)}`}
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="saved-destinations-empty">No saved destinations yet.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
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
                                                    ⋮
                                                </button>

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
                                                    {/* Directions - MOVED TOP FOR MOBILE */}
                                                    <button className="route-info-directions-item" onClick={liveNavigateToDestination}>
                                                        <div className="route-info-icon">
                                                            <span>🗺️</span>
                                                        </div>
                                                        <div>
                                                            <div className="route-info-value">Directions {"->"}</div>
                                                        </div>
                                                    </button>

                                                    {/* Directions */}
                                                    <button className="route-time-select-item" onClick={showTimeSelectorFunction}>
                                                        <div className="route-info-icon">
                                                            <span>⌚</span>
                                                        </div>
                                                        <div>
                                                            <div className="route-info-value">Choose a time</div>
                                                        </div>
                                                    </button>

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
                                                </div>
                                            </div>
                                        </>
                                    )}
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
                            <span className="clear-button-x" aria-hidden="true">×</span>
                        </button>
                    </div>


                    {/* Save Place Modal */}
                    {savePlaceModalOpen && !isMobileView && (
                        <div className="save-place-overlay" onClick={onSavePlaceCancel}>
                            <div className="save-place-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                                <div className="save-place-header">
                                    <h3>Save {savePlaceType || "place"}</h3>
                                    <button
                                        type="button"
                                        className="save-place-close"
                                        onClick={onSavePlaceCancel}
                                        aria-label="Close save place dialog"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <label className="save-place-label" htmlFor="save-place-input">
                                    Name this {savePlaceType ? savePlaceType.toLowerCase() : "place"}
                                </label>
                                <input
                                    id="save-place-input"
                                    className={`save-place-input ${savePlaceError ? "has-error" : ""}`}
                                    value={savePlaceLabel}
                                    onFocus={this.handleSavePlaceInputFocus}
                                    onBlur={this.handleSavePlaceInputBlur}
                                    onChange={(e) => onSavePlaceLabelChange(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            onSavePlaceConfirm();
                                        }
                                    }}
                                    placeholder="e.g. Home, Office"
                                    maxLength={80}
                                    autoFocus
                                />
                                {savePlaceError && (
                                    <div className="save-place-error">{savePlaceError}</div>
                                )}
                                <div className="save-place-actions">
                                    <button
                                        type="button"
                                        className="save-place-btn ghost"
                                        onClick={onSavePlaceCancel}
                                        disabled={isSavingPlace}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="save-place-btn primary"
                                        onClick={onSavePlaceConfirm}
                                        disabled={isSavingPlace || !savePlaceLabel?.trim()}
                                    >
                                        {isSavingPlace ? "Saving..." : "Save"}
                                    </button>
                                </div>
                                <div className="save-place-hint">Up to 80 characters.</div>
                            </div>
                        </div>
                    )}

                    {/* Error Popup */}
                    {errorPopup && (
                        <div className="rp-alert-overlay" onClick={() => setErrorPopup(null)}>
                            <div className="rp-alert-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                                <button
                                    type="button"
                                    className="rp-alert-close"
                                    onClick={() => setErrorPopup(null)}
                                    aria-label="Close error dialog"
                                >
                                    <X size={18} />
                                </button>
                                <div className="rp-alert-icon">
                                    <AlertTriangle size={22} />
                                </div>
                                <h3>{errorPopup.title || "Something went wrong"}</h3>
                                <p>{errorPopup.message || "Please try again."}</p>
                                <button
                                    type="button"
                                    className="rp-alert-action"
                                    onClick={() => setErrorPopup(null)}
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
                {showSavedDestinations && !isMobileView && (
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
                                        <div
                                            key={d.id}
                                            className="saved-destinations-item"
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => selectSavedDestination(d)}
                                            onKeyDown={(event) => {
                                                if (event.key === "Enter" || event.key === " ") {
                                                    event.preventDefault();
                                                    selectSavedDestination(d);
                                                }
                                            }}
                                        >
                                            <div className="saved-destinations-item-header">
                                                <div className="saved-destinations-title">{d.label}</div>
                                                <button
                                                    type="button"
                                                    className="saved-destinations-remove"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        onDeleteSavedDestination(d.id);
                                                    }}
                                                    disabled={deletingDestinationId === d.id}
                                                    title="Remove saved destination"
                                                >
                                                    {deletingDestinationId === d.id ? "Removing..." : "Remove"}
                                                </button>
                                            </div>
                                            <div className="saved-destinations-sub">
                                                {d.address?.trim()
                                                    ? d.address
                                                    : `${Number(d.latitude).toFixed(5)}, ${Number(d.longitude).toFixed(5)}`}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="saved-destinations-empty">No saved destinations yet.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
