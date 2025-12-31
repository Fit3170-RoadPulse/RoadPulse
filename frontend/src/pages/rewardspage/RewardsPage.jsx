import { useNavigate } from "react-router-dom";
import { X, Award } from "lucide-react";
import { useState, useEffect } from "react";
import "./RewardsPage.css";
import { fetchRewardAccount } from "../../lib/api";

function RewardsPage() {
    const navigate = useNavigate();
    const [points, setPoints] = useState(0);
    const [username, setUsername] = useState("");
    const [updatedDate] = useState(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
    const [expireDate] = useState(() => {
        const now = new Date();
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return lastDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    });
    const [activeTab, setActiveTab] = useState("redeem");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [distanceKm, setDistanceKm] = useState(null);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);

    // Fetch user reward account data on component mount
    useEffect(() => {
        async function loadUserData() {
            try {
                setLoading(true);
                const data = await fetchRewardAccount();
                setPoints(Number(data.reward_points ?? 0));
                setUsername(data.username ?? "");
                setDistanceKm(Number(data.cumulative_distance ?? 0));
                setError(null);
            } catch (err) {
                console.error("Failed to fetch reward account:", err);
                setError(err.message);
                // If authentication failed, redirect to login
                if (err.message.includes("Authentication failed")) {
                    navigate("/login-page", { replace: true });
                }
            } finally {
                setLoading(false);
            }
        }

        loadUserData();
    }, [navigate]);

    // Close barcode modal on Escape
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") setShowBarcodeModal(false);
        };
        if (showBarcodeModal) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showBarcodeModal]);

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

            {/* Loading State */}
            {loading && (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                    <p>Loading your rewards...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
                    <p>Error: {error}</p>
                </div>
            )}

            {/* Points Card */}
            <div className="points-section">
                <div className="points-card">
                    <div className="card-background-circle"></div>

                    <div className="barcode-section">
                        <div className="barcode-container">
                            <button
                                type="button"
                                onClick={() => setShowBarcodeModal(true)}
                                aria-label="Open barcode"
                                style={{ background: 'white', padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer' }}
                            >
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
                            </button>
                        </div>
                        {/* <div className="user-badge">
                            <p className="user-name">Jack Barcode</p>
                        </div> */}
                    </div>

                    <div className="points-info">
                        <p className="points-amount">
                            {Number(points).toLocaleString(undefined, { maximumFractionDigits: 2 })} Points
                        </p>
                        <p className="last-updated">Last updated {updatedDate}</p>                       
                    </div>
                </div>
            </div>

            {/* Total distance travelled (below points card) */}
            {/* Total distance travelled (boxed panel below points card) */}
            <div className="mt-1 mb-4 w-full max-w-sm mx-auto rounded-lg border p-3 bg-white text-center">
                {loading ? (
                    <p className="text-sm text-gray-500">Loading distance…</p>
                ) : distanceKm != null ? (
                    <p className="text-sm" style={{ margin: 0 }}>
                        Total distance travelled: <strong>{distanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km</strong>
                    </p>
                ) : (
                    <p className="text-sm text-gray-500" style={{ margin: 0 }}>No distance data available</p>
                )}
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
            {/* Barcode modal overlay (full page) */}
            {showBarcodeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
                    <div
                        className="absolute inset-0"
                        onClick={() => setShowBarcodeModal(false)}
                        style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
                        aria-hidden
                    />

                    <div className="relative z-10 p-4 w-full max-w-[92vw]">
                        <div className="rounded-lg bg-white p-6 shadow-lg mx-auto" style={{ maxWidth: 820 }}>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowBarcodeModal(false)}
                                    aria-label="Close barcode"
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 20 }}
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex justify-center">
                                <svg width="820" height="320" viewBox="0 0 820 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="enlarged-barcode">
                                    <rect x="20" y="32" width="36" height="256" fill="#111" />
                                    <rect x="76" y="32" width="24" height="256" fill="#111" />
                                    <rect x="120" y="32" width="36" height="256" fill="#111" />
                                    <rect x="184" y="32" width="24" height="256" fill="#111" />
                                    <rect x="236" y="32" width="52" height="256" fill="#111" />
                                    <rect x="312" y="32" width="24" height="256" fill="#111" />
                                    <rect x="360" y="32" width="36" height="256" fill="#111" />
                                    <rect x="420" y="32" width="52" height="256" fill="#111" />
                                    <rect x="488" y="32" width="24" height="256" fill="#111" />
                                    <rect x="538" y="32" width="36" height="256" fill="#111" />
                                    <rect x="600" y="32" width="24" height="256" fill="#111" />
                                    <rect x="648" y="32" width="52" height="256" fill="#111" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RewardsPage;
