import React, { useState, useEffect } from "react";
import {
  ArrowBigUp,
  ArrowBigDown,
  ArrowLeft,
  ArrowRight,
  CornerUpLeft,
  CornerUpRight,
  Merge,
  GitFork,
  Circle,
  MapPin,
  Move,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import "./NavigationDirectionsList.css";

export default function NavigationDirectionsList({ steps, currentStepIndex = 0 }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!steps || steps.length === 0) return null;

  // Helper to get icon based on maneuver
  const getIcon = (maneuver) => {
    if (!maneuver) return <Move  />;
    
    // Normalize string
    const m = maneuver.toLowerCase().replace("-", "_");

    if (m.includes("left")) {
       if (m.includes("sharp")) return <CornerUpLeft />;
       if (m.includes("uturn")) return <ArrowBigDown className="rotate-90" />; // rough approx
       return <ArrowLeft />;
    }
    if (m.includes("right")) {
       if (m.includes("sharp")) return <CornerUpRight />;
       if (m.includes("uturn")) return <ArrowBigDown className="-rotate-90" />;
       return <ArrowRight />;
    }
    if (m.includes("straight")) return <ArrowBigUp />;
    if (m.includes("merge")) return <Merge />;
    if (m.includes("fork")) return <GitFork />;
    if (m.includes("roundabout")) return <Circle />; // Simplified
    
    return <ArrowBigUp />; // Default straight
  };

  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  // If mobile and not expanded, we treat it differently in CSS, 
  // but we also need a toggle button.
  
  return (
    <div className="nav-directions-container">
      <ul className={`nav-directions-list ${isMobile && !isExpanded ? "collapsed" : ""}`}>
        {steps.map((step, index) => {
          const isCurrent = index === currentStepIndex;
          const maneuver = step?.navigationInstruction?.maneuver;
          const instruction = step?.navigationInstruction?.instructions || "Continue";
          const distance = step?.distanceMeters || 0;

          return (
            <li 
              key={index} 
              className={`nav-step-item ${isCurrent ? "current" : ""}`}
              onClick={() => {
                // optional: jump to step on map
              }}
            >
              <div className="nav-step-icon">
                {getIcon(maneuver)}
              </div>
              
              <div className="nav-step-content">
                <span className="nav-instruction">{instruction}</span>
                <span className="nav-distance">{formatDistance(distance)}</span>
              </div>

              <div className="nav-step-number">
                #{index + 1}
              </div>
            </li>
          );
        })}
      </ul>
      
      {isMobile && (
        <button 
           className="mobile-toggle-btn"
           onClick={() => setIsExpanded(!isExpanded)}
        >
           {isExpanded ? (
             <>
               <ChevronDown size={16} /> Hide next steps
             </>
           ) : (
             <>
               <ChevronUp size={16} /> Show next steps
             </>
           )}
        </button>
      )}
    </div>
  );
}
