import { useNavigate } from "react-router-dom";
import { X, Award, Plus, Trash2, Edit2, Upload, Save } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import Barcode from "react-barcode";
import "./RewardsPage.css";
import { 
    fetchRewardAccount, 
    fetchExchangeItems, 
    redeemReward, 
    fetchUserRedemptions,
    markVoucherAsRedeemed,
    fetchAdminRewards,
    createReward,
    updateReward,
    deleteReward
} from "../../lib/api";

function RewardsPage() {    
    const navigate = useNavigate();
    const [points, setPoints] = useState(0);
    const [username, setUsername] = useState("");
    const [isStaff, setIsStaff] = useState(localStorage.getItem("is_staff") === "true");
    const [updatedDate] = useState(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
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
    
    // Admin States
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminRewards, setAdminRewards] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editReward, setEditReward] = useState({
        name: "",
        description: "",
        points_cost: 100,
        stock: "",
        is_active: true,
        image: null
    });
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    
    // Success notification state
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [isErrorNotification, setIsErrorNotification] = useState(false);
    
    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteRewardId, setDeleteRewardId] = useState(null);
    
    // Purchase confirmation state
    const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
    
    // Voucher redemption state
    const [showRedeemVoucherConfirm, setShowRedeemVoucherConfirm] = useState(false);
    const [voucherToRedeem, setVoucherToRedeem] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [redeemedVoucher, setRedeemedVoucher] = useState(null);

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
                const items = await fetchExchangeItems();                
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
                const vouchers = await fetchUserRedemptions();
                const mappedVouchers = vouchers.map(voucher => ({
                    id: voucher.id,
                    name: voucher.item.name,
                    description: voucher.item.description,
                    redeemed_at: voucher.redeemed_at ?? null,
                    purchased_at: voucher.created_at,
                    status: voucher.redeemed_at ? "used" : "active",
                    code: voucher.code,
                }));
                setUserVouchers(mappedVouchers.filter(voucher => voucher.status === "active"));
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

    // Show purchase confirmation dialog
    const handlePurchaseConfirm = () => {
        setShowPurchaseConfirm(true);
    };
    
    // Actually execute the purchase after confirmation
    const handleConfirmPurchaseAction = async () => {
        if (!selectedItem) return;
        setShowPurchaseConfirm(false);

        try {
            console.log("Current points before purchase:", points);
            const result = await redeemReward(selectedItem.id);
            console.log("API response:", result);
            console.log("Remaining points from API:", result.remaining_points);
            
            // Update points with the remaining points from response
            setPoints(result.remaining_points);
            console.log("Points set from API response:", result.remaining_points);
            
            // Also refresh the reward account to ensure points are in sync
            const accountData = await fetchRewardAccount();
            console.log("Account data:", accountData);
            console.log("Reward points from account:", accountData.reward_points);
            setPoints(accountData.reward_points);
            console.log("Points set from account fetch:", accountData.reward_points);
            
            setShowPurchaseModal(false);
            const itemName = selectedItem.name;
            setSelectedItem(null);
            
            // Show success notification
            setSuccessMessage(`Successfully redeemed ${itemName}!`);
            setIsErrorNotification(false);
            setShowSuccessNotification(true);
            setTimeout(() => setShowSuccessNotification(false), 3000);
            
            // Refresh vouchers            
            const vouchers = await fetchUserRedemptions();
            const mappedVouchers = vouchers.map(voucher => ({
                id: voucher.id,
                name: voucher.item.name,
                description: voucher.item.description,
                redeemed_at: voucher.redeemed_at ?? null,
                purchased_at: voucher.created_at,
                status: voucher.redeemed_at ? "used" : "active",
                code: voucher.code,
            }));
            setUserVouchers(mappedVouchers.filter(voucher => voucher.status === "active"));
            console.log("Updated user vouchers after redemption");
        } catch (err) {
            console.error("Failed to redeem reward:", err);
            setShowPurchaseModal(false);
            setSelectedItem(null);
            
            // Show custom error notification
            if (err.message.includes("Not enough reward points")) {
                setSuccessMessage("Insufficient points to purchase this reward!");
            } else {
                setSuccessMessage(`Failed to redeem reward: ${err.message}`);
            }
            // Show error notification in red
            setIsErrorNotification(true);
            setShowSuccessNotification(true);
            setTimeout(() => setShowSuccessNotification(false), 3000);
        }
    };

    // Handle voucher "Redeem" click
    const handleRedeemVoucherClick = (e, voucher) => {
        e.stopPropagation(); // Prevent opening the voucher detail modal
        setVoucherToRedeem(voucher);
        setShowRedeemVoucherConfirm(true);
    };

    // Confirm redemption
    const handleConfirmVoucherRedemption = async () => {
        if (!voucherToRedeem) return;
        
        try {
            if (voucherToRedeem.redeemed_at) {
                setShowRedeemVoucherConfirm(false);
                setSuccessMessage("This voucher has already been redeemed.");
                setIsErrorNotification(true);
                setShowSuccessNotification(true);
                setTimeout(() => setShowSuccessNotification(false), 3000);
                return;
            }
            await markVoucherAsRedeemed(voucherToRedeem.id);
            
            // Remove from list or update status
            // The user wants it removed from "My Vouchers"
            setUserVouchers(prev => prev.filter(v => v.id !== voucherToRedeem.id));
            
            // Show QR Code modal with the redeemed voucher details
            setRedeemedVoucher(voucherToRedeem);
            setShowRedeemVoucherConfirm(false);
            setShowQRModal(true);
            
            setSuccessMessage(`Redemed ${voucherToRedeem.name}!`);
            setIsErrorNotification(false);
            setShowSuccessNotification(true);
            setTimeout(() => setShowSuccessNotification(false), 3000);
            
        } catch (err) {
            console.error("Failed to redeem voucher:", err);
            setShowRedeemVoucherConfirm(false);
            setSuccessMessage(`Failed to redeem: ${err.message}`);
            setIsErrorNotification(true);
            setShowSuccessNotification(true);
            setTimeout(() => setShowSuccessNotification(false), 3000);
        }
    };

    // Load admin rewards when modal opens
    useEffect(() => {
        if (showAdminModal && isStaff) {
            loadAdminRewards();
        }
    }, [showAdminModal, isStaff]);

    const loadAdminRewards = async () => {
        try {
            const rewards = await fetchAdminRewards();
            setAdminRewards(rewards);
        } catch (err) {
            console.error("Failed to fetch admin rewards:", err);
        }
    };

    const loadExchangeItemsRefresh = async () => {
        try {                
            const items = await fetchExchangeItems();                
            setExchangeItems(items);
        } catch (err) {
            console.error("Failed to fetch exchange items:", err);
        }
    };

    // Admin CRUD Handlers
    const handleAdminEdit = (reward) => {
        setEditReward({
            ...reward,
            stock: reward.stock ?? "",
            image: null
        });
        setImagePreview(reward.image);
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setEditReward({
            name: "",
            description: "",
            points_cost: 100,
            stock: "",
            is_active: true,
            image: null
        });
        setImagePreview(null);
        setIsEditing(true);
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditReward({ ...editReward, image: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveReward = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("name", editReward.name);
            formData.append("description", editReward.description);
            formData.append("points_cost", editReward.points_cost);
            if (editReward.stock !== "") {
                formData.append("stock", editReward.stock);
            }
            formData.append("is_active", editReward.is_active);
            
            if (editReward.image) {
                formData.append("image", editReward.image);
            }

            if (editReward.id) {
                await updateReward(editReward.id, formData);
                setSuccessMessage("Reward updated successfully!");
            } else {
                await createReward(formData);
                setSuccessMessage("Reward created successfully!");
            }
            
            setShowSuccessNotification(true);
            setTimeout(() => setShowSuccessNotification(false), 3000);
            
            setIsEditing(false);
            await loadAdminRewards();
            await loadExchangeItemsRefresh();
        } catch (err) {
            alert(`Failed to save reward: ${err.message}`);
        }
    };

    const handleDeleteReward = (id) => {
        setDeleteRewardId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteReward = async () => {
        try {
            await deleteReward(deleteRewardId);
            await loadAdminRewards();
            await loadExchangeItemsRefresh();
            setSuccessMessage("Reward deleted successfully!");
            setShowSuccessNotification(true);
            setTimeout(() => setShowSuccessNotification(false), 3000);
        } catch (err) {
            alert(`Failed to delete reward: ${err.message}`);
        } finally {
            setShowDeleteConfirm(false);
            setDeleteRewardId(null);
        }
    };

    // Close modals on Escape
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                setShowPurchaseModal(false);
                setShowVoucherModal(false);
                if (!isEditing) setShowAdminModal(false);
            }
        };
        if (showPurchaseModal || showVoucherModal || showAdminModal) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showPurchaseModal, showVoucherModal]);

    return (
        <div className="rewards-page">
            {/* Header */}
            <div className="rewards-header">
                <div className="header-left">
                    <h1 className="page-title">Rewards - {activeTab === "redeem" ? "Redeem Points" : "My Vouchers"}</h1>

                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        {isStaff && (
                            <button 
                                onClick={() => setShowAdminModal(true)} 
                                className="admin-manage-btn"
                            >
                                Manage Rewards
                            </button>
                        )}
                        <button onClick={() => navigate(-1)} className="back-button">
                            <X size={24} />
                        </button>
                    </div>
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
                            {/* Barcode under username */}
                            <div style={{marginTop: '12px', backgroundColor: 'white', padding: '8px', borderRadius: '8px', display: 'flex', justifyContent: 'center'}}>
                                <Barcode 
                                    value={username || "USER"}
                                    format="CODE128"
                                    width={1.5}
                                    height={40}
                                    fontSize={12}
                                    margin={0}
                                    displayValue={false}
                                />
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
                                    <div className="reward-image">
                                        {item.image ? (
                                            <img 
                                                src={item.image.startsWith('http') ? item.image : `http://127.0.0.1:8000${item.image}`} 
                                                alt={item.name}
                                            />
                                        ) : (
                                            <Award size={48} style={{color: '#9ca3af'}} />
                                        )}
                                    </div>
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
                                <div key={voucher.id} className="voucher-card">
                                    <div className="voucher-header">
                                        <Award size={32} className="voucher-icon" />
                                        <div className="voucher-info">
                                            <h3 className="voucher-name">{voucher.name}</h3>
                                            <p className="voucher-description">{voucher.description}</p>
                                            <p className="voucher-date">Bought at: {new Date(voucher.purchased_at ?? voucher.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className={`voucher-status ${voucher.status}`}>
                                            {voucher.status === "active" ? "Active" : "Used"}
                                        </div>
                                    </div>
                                    {voucher.status === "active" && (
                                        <div className="voucher-actions" style={{marginTop: '12px', display: 'flex', justifyContent: 'flex-end'}}>
                                            <button
                                                onClick={(e) => handleRedeemVoucherClick(e, voucher)}
                                                className="redeem-voucher-btn"
                                                style={{
                                                    backgroundColor: '#f59e0b',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                fontSize: '14px',
                                                zIndex: 10
                                            }}
                                        >
                                            <Award size={16} />
                                            Use Now
                                        </button>
                                    </div>
                                )}
                                </div>
                            ))
                        ) : (
                            <p>No vouchers yet. Exchange points for rewards to see them here!</p>
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
                                <h3 className="text-lg font-semibold">Purchase</h3>
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
                                    Points after purchase: <span className="font-semibold">{Math.max(0, Number(points) - selectedItem.points_cost).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </p>
                            </div>

                            <div className="rewards-modal-actions">
                                <button
                                    onClick={() => setShowPurchaseModal(false)}
                                    className="rewards-modal-button rewards-modal-button-cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePurchaseConfirm}
                                    disabled={Number(points) < selectedItem.points_cost}
                                    className="rewards-modal-button rewards-modal-button-confirm"
                                >
                                    Confirm Purchase
                                </button>
                            </div>
                            
                            {/* Confirmation overlay inside purchase modal */}
                            {showPurchaseConfirm && (
                                <div 
                                    style={{
                                        position: 'absolute',
                                        inset: 0,
                                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 20
                                    }}
                                >
                                    <div 
                                        style={{
                                            background: 'white',
                                            borderRadius: '12px',
                                            padding: '24px',
                                            maxWidth: '320px',
                                            width: '90%',
                                            animation: 'fadeIn 0.2s ease-out'
                                        }}
                                    >
                                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '50%',
                                                backgroundColor: '#dcfce7',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 16px'
                                            }}>
                                                <Award size={24} color="#16a34a" />
                                            </div>
                                            <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                                                Confirm Purchase
                                            </h4>
                                            <p style={{ fontSize: '14px', color: '#6b7280' }}>
                                                Are you sure you want to purchase this reward?
                                            </p>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <button
                                                onClick={() => setShowPurchaseConfirm(false)}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    backgroundColor: 'white',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '8px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleConfirmPurchaseAction}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    backgroundColor: '#16a34a',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                Confirm
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
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

            {/* Admin Management Modal */}
            {showAdminModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 rewards-modal-overlay" onClick={() => !isEditing && setShowAdminModal(false)} />
                    <div className="relative z-10 admin-modal-content animate-in fade-in zoom-in duration-200">
                        <div className="admin-modal-header">
                            <h3 className="admin-modal-title">
                                {isEditing ? (editReward.id ? "Edit Reward" : "Add New Reward") : "Manage Rewards"}
                            </h3>
                            {!isEditing && (
                                <button onClick={() => setShowAdminModal(false)} className="rewards-modal-close-button">
                                    <X size={24} />
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSaveReward} className="admin-form">
                                <div className="form-group">
                                    <label className="form-label">Reward Name</label>
                                    <input 
                                        type="text" 
                                        className="form-input" 
                                        value={editReward.name}
                                        onChange={(e) => setEditReward({...editReward, name: e.target.value})}
                                        required
                                        placeholder="e.g. Starbucks $5 Voucher"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea 
                                        className="form-textarea" 
                                        rows="2"
                                        value={editReward.description}
                                        onChange={(e) => setEditReward({...editReward, description: e.target.value})}
                                        required
                                        placeholder="Describe the reward..."
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Points Cost</label>
                                        <input 
                                            type="number" 
                                            className="form-input" 
                                            value={editReward.points_cost}
                                            onChange={(e) => setEditReward({...editReward, points_cost: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Stock (optional)</label>
                                        <input 
                                            type="number" 
                                            className="form-input" 
                                            value={editReward.stock}
                                            onChange={(e) => setEditReward({...editReward, stock: e.target.value})}
                                            placeholder="Unlimited"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Reward Image</label>
                                    <div 
                                        className="image-preview-container" 
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="image-preview" />
                                        ) : (
                                            <div className="image-placeholder">
                                                <Upload size={32} style={{margin: '0 auto 8px'}} />
                                                <p>Click to upload image</p>
                                            </div>
                                        )}
                                        <input 
                                            type="file" 
                                            hidden 
                                            ref={fileInputRef}
                                            onChange={handleImageChange}
                                            accept="image/*"
                                        />
                                    </div>
                                </div>

                                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px'}}>
                                    <input 
                                        type="checkbox" 
                                        id="is_active" 
                                        checked={editReward.is_active}
                                        onChange={(e) => setEditReward({...editReward, is_active: e.target.checked})}
                                    />
                                    <label htmlFor="is_active" style={{fontSize: '14px', fontWeight: 500}}>Active and visible to users</label>
                                </div>

                                <div className="form-actions">
                                    <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                                        <Save size={18} />
                                        Save Reward
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <button className="btn-add-new" onClick={handleAddNew} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                                    <Plus size={20} />
                                    Create New Reward
                                </button>

                                <div className="admin-reward-list">
                                    {adminRewards.length > 0 ? adminRewards.map(reward => (
                                        <div key={reward.id} className="admin-reward-item">
                                            <img 
                                                src={reward.image || "https://via.placeholder.com/50"} 
                                                alt={reward.name} 
                                                className="admin-reward-thumb"
                                            />
                                            <div className="admin-reward-info">
                                                <p className="admin-reward-name">{reward.name}</p>
                                                <p className="admin-reward-points">{reward.points_cost} Points • {reward.stock ?? 'Unlimited'} • {reward.is_active ? 'Active' : 'Inactive'}</p>
                                            </div>
                                            <div style={{display: 'flex', gap: '8px'}}>
                                                <button 
                                                    style={{padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer'}}
                                                    onClick={() => handleAdminEdit(reward)}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    style={{padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', background: 'white', cursor: 'pointer', color: '#ef4444'}}
                                                    onClick={() => handleDeleteReward(reward.id)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <p style={{textAlign: 'center', padding: '32px 0', color: '#9ca3af'}}>No rewards created yet.</p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Custom Success Notification */}
            {showSuccessNotification && (
                <div 
                    style={{
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: isErrorNotification ? '#ef4444' : '#10b981',
                        color: 'white',
                        padding: '20px 32px',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        animation: 'fadeInScale 0.3s ease-out',
                        minWidth: '300px',
                        justifyContent: 'center'
                    }}
                >
                    <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        {isErrorNotification ? (
                             <path d="M18 6L6 18M6 6l12 12"></path>
                        ) : (
                            <>
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </>
                        )}
                    </svg>
                    <span style={{ fontWeight: 600, fontSize: '16px' }}>{successMessage}</span>
                </div>
            )}

            {/* Redeem Confirmation Modal */}
            {showRedeemVoucherConfirm && voucherToRedeem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 rewards-modal-overlay" onClick={() => setShowRedeemVoucherConfirm(false)} />
                    <div className="relative z-10 bg-white rounded-lg p-6 max-w-sm w-full shadow-xl animate-in fade-in zoom-in duration-200 rewards-modal-content">
                        <h3 className="text-lg font-bold mb-2">Ready to redeem?</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to redeem <strong>{voucherToRedeem.name}</strong>?
                            This action cannot be undone.
                        </p>
                        <div className="rewards-modal-actions">
                            <button
                                onClick={() => setShowRedeemVoucherConfirm(false)}
                                className="rewards-modal-button rewards-modal-button-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmVoucherRedemption}
                                className="rewards-modal-button rewards-modal-button-amber"
                            >
                                Confirm & Redeem
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Success Modal */}
            {showQRModal && redeemedVoucher && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
                    <div className="absolute inset-0 rewards-modal-overlay" onClick={() => setShowQRModal(false)} />
                    <div className="relative z-10 bg-white rounded-lg p-8 max-w-sm w-full shadow-xl animate-in fade-in zoom-in duration-200 text-center rewards-modal-content">
                        <button 
                            onClick={() => setShowQRModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={24} />
                        </button>
                        
                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <Award size={32} className="text-green-600" />
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Voucher Redeemed!</h3>
                        <p className="text-gray-500 mb-6">Show this code to the merchant</p>
                        
                        <div className="bg-white p-4 rounded-xl border-2 border-dashed border-gray-200 mb-6 inline-block">
                            <QRCodeSVG
                                value={`VOUCHER:${redeemedVoucher.code}:REDEEMED`}
                                size={200}
                                level="H"
                            />
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg mb-6">
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Voucher Code</p>
                            <p className="text-lg font-mono font-bold text-gray-900">{redeemedVoucher.code}</p>
                        </div>
                        
                        <button
                            onClick={() => setShowQRModal(false)}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div 
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '16px'
                    }}
                    role="dialog" 
                    aria-modal="true"
                >
                    <div 
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.5)'
                        }}
                        onClick={() => setShowDeleteConfirm(false)} 
                    />
                    <div 
                        style={{
                            position: 'relative',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '400px',
                            width: '100%',
                            zIndex: 10,
                            animation: 'fadeIn 0.2s ease-out'
                        }}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: '#fee2e2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px'
                            }}>
                                <Trash2 size={24} color="#ef4444" />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>
                                Delete Reward
                            </h3>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>
                                Are you sure you want to delete this reward? This action cannot be undone.
                            </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: 'white',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteReward}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RewardsPage;
