import React, { useEffect } from "react";
import "./MapSideBarComponent.css";
import MapIcon from "../../assets/map.png";
import PhoneCallIcon from "../../assets/phone-call.png";
import RouteIcon from "../../assets/route.png";
import ReportIcon from "../../assets/report.png";
import SearchIcon from "../../assets/search.png";
import GoIcon from "../../assets/go.png";
import ProfileIcon from "../../assets/profile.png";


export default function MapPage({ onSearch, showRouteUI = false }) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const className = "rp-map-type-menu-open";
    const infoClassName = "rp-map-info-open";
    const routeClassName = "rp-route-ui-open";

    const isElementVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const updateMenuState = () => {
      const menus = document.querySelectorAll(".gm-style-mtc ul[role='menu']");
      let isOpen = false;
      menus.forEach((menu) => {
        const style = window.getComputedStyle(menu);
        if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
          isOpen = true;
        }
      });
      document.body.classList.toggle(className, isOpen);

      const infoWindows = document.querySelectorAll(
        ".gm-style-iw, .gm-style-iw-c, .gm-style-iw-d, .gm-style-iw-t, .gm-style-iw-a, [class*='gm-style-iw']"
      );
      let infoOpen = false;
      infoWindows.forEach((node) => {
        if (isElementVisible(node)) infoOpen = true;
      });
      document.body.classList.toggle(infoClassName, infoOpen);

      const routeNodes = document.querySelectorAll(".route-info-container, .route-info-card");
      let routeOpen = false;
      routeNodes.forEach((node) => {
        if (isElementVisible(node)) routeOpen = true;
      });
      document.body.classList.toggle(routeClassName, showRouteUI || routeOpen);
    };

    updateMenuState();
    const observer = new MutationObserver(updateMenuState);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["style", "class", "aria-expanded", "aria-hidden"],
    });
    const intervalId = window.setInterval(updateMenuState, 250);
    window.addEventListener("resize", updateMenuState);

    return () => {
      observer.disconnect();
      window.clearInterval(intervalId);
      window.removeEventListener("resize", updateMenuState);
      document.body.classList.remove(className);
      document.body.classList.remove(infoClassName);
      document.body.classList.remove(routeClassName);
    };
  }, [showRouteUI]);

  return (
    <div className="overlay"> {/* <- positioned and non-blocking by default */}
      <div className="map-page">
        <div className="sidebar">
          <span className="sidebar-emoji">🚦</span>

          <button className="sidebar-button sidebar-button-clickable"
            onClick={() => (window.location.href = "/map")}>
            <img src={MapIcon} alt="Map" />
            <span>Map</span>
          </button>

          <button className="sidebar-button sidebar-button-clickable"
            onClick={() => (window.location.href = "/Emergency")}>
            <img src={PhoneCallIcon} alt="Emergency" />
            <span>Emergency</span>
          </button>

          <button className="sidebar-button sidebar-button-clickable"
            onClick={() => (window.location.href = "/report")}>
            <img src={ReportIcon} alt="Reports" />
            <span>Reports</span>
          </button>

          <button className="sidebar-button sidebar-button-clickable"
            onClick={() => (window.location.href = "/profile-page")}>
            <img src={ProfileIcon} alt="Profile" />
            <span>Profile</span>
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
