import "./DefaultRouteOptions.css";
import RouteOptionsComponent from "../../../components/RouteOptionsComponent/RouteOptionsComponent.jsx";
import { useState, useEffect, use } from "react";
import SettingMenu from "../Menu/SettingMenu";
import { Link, useNavigate } from "react-router-dom";
import { useRoutePreferences } from "@/components/RoutePreferencesContext";

export default function DefaultRouteOptions() {
    const {isTollRoadsOn, setIsTollRoadsOn} = useRoutePreferences();
    const navigate = useNavigate();

    // tollroads functions for handling toll roads toggle
    let toggleTollRoads = () => {
        setIsTollRoadsOn(prev => !prev);
    }

    return (
        <div class="route-options-box">

            <button
                className="close-btn"
                aria-label="Close"
                onClick={() => navigate("/setting-menu-page")}
                title="Back to settings"
                type="button"
            >
                ✕
            </button>

            <div className="settings-layout">
                <aside className="settings-left-column" aria-hidden={false}>
                <SettingMenu />
                </aside>

                <main className="settings-main-column" role="main">
                    <div class="settings-panel">
                    <RouteOptionsComponent isTollRoadsOn={isTollRoadsOn} toggleTollRoads={toggleTollRoads}></RouteOptionsComponent>
                    </div>
                </main>
            </div>
        </div>
    )
}