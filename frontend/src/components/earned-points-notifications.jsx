import React, { useEffect } from "react";
import "./earned-points-notifications.css";

export default function EarnedPointsNotification({ points, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), 3000); // stays 3s
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="earned-points-notification">
      <strong>Drive Completed!</strong>
      <p>Congratulations, you have earned {points} points!</p>
    </div>
  );
}
