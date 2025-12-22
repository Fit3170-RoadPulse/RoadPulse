import { useNavigate } from "react-router-dom";
import { X, Award } from "lucide-react";
import { useState } from "react";
import "./RewardsPage.css";
import PointsWidget from "../../components/point-widget-component";

function RewardsPage() {
    const navigate = useNavigate();
    // Points are now handled by the PointsWidget component
    const [activeTab, setActiveTab] = useState("redeem");

    return (
        <div className="rewards-page">
            {/* Header */}
            <div className="rewards-header">
                <div className="header-left">
                    <h1 className="page-title">Rewards - Redeem Rewards</h1>

                    <button onClick={() => navigate(-1)} className="back-button">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Points Card replaced by PointsWidget component */}
            <div className="points-section">
                <PointsWidget />
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab ${activeTab === "redeem" ? "active" : ""}`}
                    onClick={() => setActiveTab("redeem")}
                >
                    Redeem Rewards
                </button>
                <button
                    className={`tab ${activeTab === "active" ? "active" : ""}`}
                    onClick={() => setActiveTab("active")}
                >
                    Active
                </button>
                <button
                    className={`tab ${activeTab === "past" ? "active" : ""}`}
                    onClick={() => setActiveTab("past")}
                >
                    Past
                </button>
            </div>

            {/* Rewards Grid */}
            <div className="rewards-content">
                <div className="rewards-grid">
                    {[
                        "Upcoming Reward",
                        "New Rewards Coming Soon",
                        "Gift Voucher",
                        "Redeem POS Voucher",
                    ].map((rewardName, index) => (
                        <div key={index} className="reward-card">
                            <Award size={48} className="reward-icon" />
                            <p className="reward-name">{rewardName}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default RewardsPage;
