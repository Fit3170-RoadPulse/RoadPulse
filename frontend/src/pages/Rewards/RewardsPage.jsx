import { useNavigate } from "react-router-dom";
import { X, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import "./RewardsPage.css";
import { fetchRewardAccount, fetchExchangeItems, redeemReward, fetchUserRedemptions } from "../../lib/api";

function RewardsPage() {
    console.log("RewardsPage component rendered");
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
    const [exchangeItems, setExchangeItems] = useState([]);
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [userVouchers, setUserVouchers] = useState([]);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);

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

    // Fetch exchange items on component mount
    useEffect(() => {
        async function loadExchangeItems() {
            try {
                console.log("Fetching exchange items...");
                const items = await fetchExchangeItems();
                console.log("Fetched items:", items);
                setExchangeItems(items);
            } catch (err) {
                console.error("Failed to fetch exchange items:", err);
                // Don't set error state for items, just log
            }
        }

        loadExchangeItems();
    }, []);

    // Load user vouchers (from API)
    useEffect(() => {
        async function loadUserVouchers() {
            try {
                console.log("Fetching user vouchers...");
                const vouchers = await fetchUserRedemptions();
                console.log("Fetched vouchers:", vouchers);
                setUserVouchers(vouchers.map(voucher => ({
                    id: voucher.id,
                    name: voucher.item.name,
                    description: voucher.item.description,
                    redeemed_at: voucher.created_at,
                    status: "active", // Assuming all are active for now
                    code: voucher.code,
                })));
                console.log("Set user vouchers");
            } catch (err) {
                console.error("Failed to fetch user vouchers:", err);
                // Don't set error state for vouchers, just log
            }
        }

        loadUserVouchers();
    }, []);

    // Handle reward card click
    const handleRewardClick = (item) => {
        setSelectedItem(item);
        setShowPurchaseModal(true);
    };

    // Handle voucher card click
    const handleVoucherClick = (voucher) => {
        setSelectedVoucher(voucher);
        setShowVoucherModal(true);
    };

    // Handle purchase confirmation
    const handlePurchaseConfirm = async () => {
        if (!selectedItem) return;

        try {
            const result = await redeemReward(selectedItem.id);
            // Update points with the remaining points from response
            setPoints(result.remaining_points);
            setShowPurchaseModal(false);
            setSelectedItem(null);
            alert(`Successfully redeemed ${selectedItem.name}!`);
            
            // Refresh vouchers
            console.log("Refreshing vouchers after redemption...");
            const vouchers = await fetchUserRedemptions();
            console.log("Refreshed vouchers:", vouchers);
            setUserVouchers(vouchers.map(voucher => ({
                id: voucher.id,
                name: voucher.item.name,
                description: voucher.item.description,
                redeemed_at: voucher.created_at,
                status: "active",
                code: voucher.code,
            })));
            console.log("Updated user vouchers after redemption");
        } catch (err) {
            console.error("Failed to redeem reward:", err);
            if (err.message.includes("Not enough reward points")) {
                alert("You don't have enough points to redeem this reward.");
            } else {
                alert(`Failed to redeem reward: ${err.message}`);
            }
        }
    };

    // Close modals on Escape
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                setShowPurchaseModal(false);
                setShowVoucherModal(false);
            }
        };
        if (showPurchaseModal || showVoucherModal) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showPurchaseModal, showVoucherModal]);

    return (
        <div className="rewards-page">
            {/* Header */}
            <div className="rewards-header">
                <div className="header-left">
                    <h1 className="page-title">Rewards - {activeTab === "redeem" ? "Redeem Points" : "My Vouchers"}</h1>

                    <button onClick={() => navigate(-1)} className="back-button">
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="rewards-loading-container">
                    <p>Loading your rewards...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="rewards-error-container">
                    <p>Error: {error}</p>
                </div>
            )}

            {/* Points Card */}
            <div className="points-section">
                <div className="points-card">
                    <div className="card-background-circle"></div>

                    <div className="user-section">
                        <div className="user-container">
                            <div className="user-info">
                                {/* <p className="user-greeting">Hello,</p> */}
                                <p className="user-name-display">{username || "User"}</p>
                            </div>
                        </div>
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
                    <p className="text-sm rewards-distance-text">
                        Total distance travelled: <strong>{distanceKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km</strong>
                    </p>
                ) : (
                    <p className="text-sm text-gray-500 rewards-distance-text">No distance data available</p>
                )}
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab ${activeTab === "redeem" ? "active" : ""}`}
                    onClick={() => setActiveTab("redeem")}
                >
                    Redeem Points
                </button>
                <button
                    className={`tab ${activeTab === "active" ? "active" : ""}`}
                    onClick={() => setActiveTab("active")}
                >
                    My Vouchers
                </button>
            </div>

            {/* Rewards Content */}
            <div className="rewards-content">
                {activeTab === "redeem" ? (
                    <div className="rewards-grid">
                        {exchangeItems.length > 0 ? (
                            exchangeItems.map((item) => (
                                <div key={item.id} className="reward-card" onClick={() => handleRewardClick(item)}>
                                    <Award size={48} className="reward-icon" />
                                    <p className="reward-name">{item.name}</p>
                                    <p className="reward-cost">{item.points_cost} points</p>
                                </div>
                            ))
                        ) : (
                            <p>No rewards available at the moment.</p>
                        )}
                    </div>
                ) : (
                    <div className="vouchers-list">
                        {userVouchers.length > 0 ? (
                            userVouchers.map((voucher) => (
                                <div key={voucher.id} className="voucher-card" onClick={() => handleVoucherClick(voucher)}>
                                    <div className="voucher-header">
                                        <Award size={32} className="voucher-icon" />
                                        <div className="voucher-info">
                                            <h3 className="voucher-name">{voucher.name}</h3>
                                            <p className="voucher-description">{voucher.description}</p>
                                            <p className="voucher-date">Redeemed: {new Date(voucher.redeemed_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className={`voucher-status ${voucher.status}`}>
                                            {voucher.status === "active" ? "Active" : "Used"}
                                        </div>
                                    </div>
                                    {voucher.status === "active" && (
                                        <div className="voucher-tap-hint">
                                            <p className="tap-text">Tap to show QR code</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p>No vouchers yet. Redeem some rewards to see them here!</p>
                        )}
                    </div>
                )}
            </div>
            {/* Purchase Confirmation Modal */}
            {showPurchaseModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
                    <div
                        className="absolute inset-0 rewards-modal-overlay"
                        aria-hidden
                    />

                    <div className="relative z-10 p-4 w-full max-w-md">
                        <div className="rounded-lg bg-white p-6 shadow-lg mx-auto rewards-modal-content">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Confirm Purchase</h3>
                                <button
                                    onClick={() => setShowPurchaseModal(false)}
                                    aria-label="Close purchase modal"
                                    className="rewards-modal-close-button"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">You are about to redeem:</p>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="font-medium">{selectedItem.name}</p>
                                    <p className="text-sm text-gray-600">{selectedItem.description}</p>
                                    <p className="text-sm font-semibold text-green-600 mt-2">{selectedItem.points_cost} points</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-600">
                                    Your current points: <span className="font-semibold">{Number(points).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                    Points after purchase: <span className="font-semibold">{(Number(points) - selectedItem.points_cost).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPurchaseModal(false)}
                                    className="flex-1 px-4 py-2 text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePurchaseConfirm}
                                    disabled={Number(points) < selectedItem.points_cost}
                                    className="flex-1 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                    Confirm Purchase
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Voucher Modal */}
            {showVoucherModal && selectedVoucher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
                    <div
                        className="absolute inset-0 rewards-modal-overlay"
                        aria-hidden
                    />

                    <div className="relative z-10 p-4 w-full max-w-md">
                        <div className="rounded-lg bg-white p-6 shadow-lg mx-auto rewards-modal-content">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">{selectedVoucher.name}</h3>
                                <button
                                    onClick={() => setShowVoucherModal(false)}
                                    aria-label="Close voucher modal"
                                    className="rewards-modal-close-button"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mb-4">
                                <div className="bg-gray-50 p-4 rounded-lg text-center">
                                    <p className="font-medium mb-2">{selectedVoucher.description}</p>
                                    <p className="text-sm text-gray-600">Redeemed: {new Date(selectedVoucher.redeemed_at).toLocaleDateString()}</p>
                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                                        selectedVoucher.status === "active"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    }`}>
                                        {selectedVoucher.status === "active" ? "Active" : "Used"}
                                    </div>
                                </div>
                            </div>

                            {selectedVoucher.status === "active" && (
                                <div className="voucher-code-modal">
                                    <p className="code-label-modal">Scan QR Code to Redeem:</p>
                                    <div className="qr-code-container-modal">
                                        <QRCodeSVG
                                            value={`VOUCHER:${selectedVoucher.code}:USER:${username || 'USER'}`}
                                            size={200}
                                            level="M"
                                            includeMargin={true}
                                        />
                                    </div>
                                    <p className="code-text-modal">Code: {selectedVoucher.code}</p>
                                </div>
                            )}

                            {selectedVoucher.status === "used" && (
                                <div className="text-center py-4">
                                    <p className="text-gray-500">This voucher has already been used.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RewardsPage;
