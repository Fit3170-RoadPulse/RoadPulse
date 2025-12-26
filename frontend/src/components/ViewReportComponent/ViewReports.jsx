import { useEffect, useState } from "react";
import "./ViewReports.css";

export default function ViewReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    console.log("ViewReports mounted");

    // MOCK DATA (replace later with API if needed)
    const initialReports = [
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
    ];

    setReports(initialReports);

    // Set auto-expiry for each report (3 minutes)
    initialReports.forEach((report) => {
      setTimeout(() => {
        setReports((prevReports) =>
          prevReports.filter((r) => r.id !== report.id)
        );
      }, 180000); // 180,000 ms = 3 minutes
    });
  }, []);

  // Handle vote
  const handleVote = (reportId, vote) => {
    if (vote === "gone") {
      // Remove the report immediately if user says it's gone
      setReports((prevReports) =>
        prevReports.filter((report) => report.id !== reportId)
      );
    }
    // If 'still', do nothing—the report will stay until auto-expiry
  };

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

            <div className="report-vote-buttons">
  <button
    className="vote-btn still"
    onClick={() => handleVote(report.id, "still")}
    title="Still there?" // tooltip text
  >
    ✅
  </button>
  <button
    className="vote-btn gone"
    onClick={() => handleVote(report.id, "gone")}
    title="Not there?" // tooltip text
  >
    ❌
  </button>
</div>

          </div>
        ))}
      </div>
    </div>
  );
}
