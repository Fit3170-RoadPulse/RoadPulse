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

export default function NavigationDirectionsList({ 
  steps, 
  currentStepIndex = 0,
  speed = 0,
  eta = "--:--",
  onEndNavigation = () => {}
}) {
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

  const currentStep = steps[currentStepIndex];
  const nextSteps = steps.slice(currentStepIndex + 1);

  const renderStep = (step, idx, isCurrent) => {
    return (
      <li key={idx} className={`nav-step-item ${isCurrent ? "current" : ""}`}>
        <div className="nav-step-leading">
          <div className="nav-step-icon">
            {getIcon(step?.navigationInstruction?.maneuver)}
          </div>
          <div className="nav-distance nav-distance-leading">
            {formatDistance(step?.distanceMeters || 0)}
          </div>
        </div>
        <div className="nav-step-content">
          <div className="nav-instruction">
            {step?.navigationInstruction?.instructions}
          </div>
        </div>
      </li>
    );
  };

  if (isMobile) {
    return (
      <div className="mobile-nav-overlay-container">
        {/* Top Bar: Speed & ETA */}
        <div className="mobile-nav-header">
           <div className="mobile-speed-display">
              <span className="label">Speed</span>
              <span className="value">{speed} <span className="unit">km/h</span></span>
           </div>
           <div className="mobile-eta-display">
              <span className="label">ETA</span>
              <span className="value">{eta}</span>
           </div>
        </div>

        {/* Current Instruction Card */}
        {currentStep && (
          <div className="mobile-instruction-card">
            <div className="mobile-card-icon">
               {getIcon(currentStep?.navigationInstruction?.maneuver)}
            </div>
            <div className="mobile-card-details">
               <div className="mobile-instruction-text">
                  {currentStep?.navigationInstruction?.instructions || "Continue"}
               </div>
               <div className="mobile-distance-text">
                  {formatDistance(currentStep?.distanceMeters || 0)}
               </div>
            </div>
          </div>
        )}

        {/* Next Steps Accordion */}
        <div className="mobile-next-steps-container">
            <button 
              className="mobile-next-steps-toggle" 
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span>Next steps</span>
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {isExpanded && (
               <ul className="nav-directions-list mobile-next-list">
                  {nextSteps.map((step, idx) => {
                       // Reuse renderStep but maybe strip internal classes if needed, 
                       // or just rely on existing CSS for .nav-step-item
                       return renderStep(step, currentStepIndex + 1 + idx, false);
                  })}
               </ul>
            )}
        </div>

        {/* End Navigation Button */}
        <button className="mobile-end-nav-btn" onClick={onEndNavigation}>
           End Navigation
        </button>
      </div>
    );
  }

  // Desktop View
  return (
    <div className="nav-directions-container">
      <ul className="nav-directions-list">
        {steps.map((step, index) => {
          const isCurrent = index === currentStepIndex;
          return renderStep(step, index, isCurrent);
        })}
      </ul>
    </div>
  );
}
