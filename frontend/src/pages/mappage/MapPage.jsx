import React from "react";
import "./MapPage.css";
import MapIcon from "../../components/map.png";
import PhoneCallIcon from "../../components/phone-call.png";
import RouteIcon from "../../components/route.png";
import ReportIcon from "../../components/report.png";
import MaximizeIcon from "../../components/add.png";
import MinimizeIcon from "../../components/minus-sign.png";
import CompassIcon from "../../components/compass.png";
import SearchIcon from "../../components/search.png";
import GoIcon from "../../components/go.png";


export default function MapPage() {
    return (
        <div className="map-page">
            <div className="sidebar">
                
                <span style={{ fontSize: "40px" }}>🚦</span>
            
                <button className="sidebar-button">
                    <img src={MapIcon} alt="MapIcon" />
                    <span>Map</span>
                </button>
                <button className="sidebar-button">
                    <img src={RouteIcon} alt="Navigate" />
                    <span>Navigate</span>
                </button>
                <button className="sidebar-button">
                    <img src={PhoneCallIcon} alt="Emergency" />
                    <span>Emergency</span>
                </button>
                <button className="sidebar-button">
                    <img src={ReportIcon} alt="Reports" />
                    <span>Reports</span>
                </button>
            </div>

            <div className="content">
                <div className="search-bar">
                    <div className="search-icon">
                        <img src={SearchIcon} alt="Search" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="search-input"
                    />
                    <img
                    src={GoIcon}
                    alt="Go"
                    className="go-icon"
                    onClick={() => console.log("Search triggered!")}
                    />
                </div>
            </div>


            <div className="bottom-right-buttons">
                <button className="compass-icon">
                    <img src={CompassIcon} alt="Compass" />
                </button>
                <button className="plus-icon">
                    <img src={MaximizeIcon} alt="Maximize" />
                </button>
                <button className="minus-icon">
                    <img src={MinimizeIcon} alt="Minimize" />
                </button>
            </div>
        </div>
    );
}
