import { useEffect, useState } from "react";
import "./ViewReports.css";

export default function ViewReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    console.log("ViewReports mounted");

    // MOCK DATA (replace later with API)
    setReports([
      {
        id: 1,
        type: "Heavy Traffic",
        time: "5 minutes ago",
        severity: "high",
      },
      {
        id: 2,
        type: "Road Closed",
        time: "25 minutes ago",
        severity: "critical",
      },
    ]);
  }, []);

  return (
    <div className="view-reports-container">
      <h3 className="view-reports-title">Recent Incidents</h3>

      <div className="view-reports-list">
        {reports.map((report) => (
          <div key={report.id} className="report-card">
            <div className={`report-icon ${report.severity}`}>⚠️</div>

            <div className="report-info">
              <span className="report-type">{report.type}</span>
              <span className="report-time">{report.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
