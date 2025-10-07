import React from "react";
import "./MapPage.css";
import MapIcon from "../../components/map.png";
import PhoneCallIcon from "../../components/phone-call.png";
import RouteIcon from "../../components/route.png";
import ReportIcon from "../../components/report.png";
import SearchIcon from "../../components/search.png";
import GoIcon from "../../components/go.png";

import { useNavigate } from "react-router";


export default function MapPage({ onSearch }) {
  const navigate = useNavigate();   // hook gives you a navigation function
  
  return (
    <div className="overlay"> {/* <- positioned and non-blocking by default */}
      <div className="map-page">
        <div className="sidebar">
          <span style={{ fontSize: "40px" }}>🚦</span>

          <button className="sidebar-button">
            <img src={MapIcon} alt="Map" />
            <span>Map</span>
          </button>
          <button className="sidebar-button">
            <img src={RouteIcon} alt="Navigate" />
            <span>Navigate</span>
          </button>

          
          <button className="sidebar-button"  
            onClick={() => (window.location.href = "/Emergency")}  
            // Now you can click this to go to the Emergency button screen
            style={{
              pointerEvents: "auto", // allow this button to receive clicks
            }} >
            
            <img src={PhoneCallIcon} alt="Emergency" />
            <span>
            Emergency</span>
            
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
              onClick={() => onSearch?.()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


