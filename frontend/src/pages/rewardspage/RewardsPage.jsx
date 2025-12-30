import { useNavigate } from "react-router-dom";
import { X, Award } from "lucide-react";
import { useState } from "react";
import "./RewardsPage.css";

function RewardsPage() {
    const navigate = useNavigate();
    const [points] = useState(1000); // Replace with actual user data
    const [updatedDate] = useState("3 September 2025"); // Replace with actual data
    const [expireDate] = useState("31 Oct 2025"); // Replace with actual data
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

            {/* Points Card */}
            <div className="points-section">
                <div className="points-card">
                    <div className="card-background-circle"></div>

                    <div className="barcode-section">
                        <div className="barcode-container">
                            <svg width="128" height="64" viewBox="0 0 128 64">
                                <rect x="5" y="2" width="6" height="60" fill="black" />
                                <rect x="14" y="2" width="4" height="60" fill="black" />
                                <rect x="22" y="2" width="6" height="60" fill="black" />
                                <rect x="32" y="2" width="4" height="60" fill="black" />
                                <rect x="40" y="2" width="8" height="60" fill="black" />
                                <rect x="52" y="2" width="4" height="60" fill="black" />
                                <rect x="60" y="2" width="6" height="60" fill="black" />
                                <rect x="70" y="2" width="8" height="60" fill="black" />
                                <rect x="82" y="2" width="4" height="60" fill="black" />
                                <rect x="90" y="2" width="6" height="60" fill="black" />
                                <rect x="100" y="2" width="4" height="60" fill="black" />
                                <rect x="108" y="2" width="8" height="60" fill="black" />
                            </svg>
                        </div>
                        {/* <div className="user-badge">
                            <p className="user-name">Jack Barcode</p>
                        </div> */}
                    </div>

                    <div className="points-info">
                        <p className="points-amount">{points} Points</p>
                        <p className="last-updated">Last updated {updatedDate}</p>
                        <p className="expiry-notice">
                            ⌛️ 14 points will expire by {expireDate}
                        </p>
                    </div>
                </div>
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
