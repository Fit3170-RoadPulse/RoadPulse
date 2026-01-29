import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import "./ProfilePage.css";
import { clearAuth, fetchRewardAccount, updateProfile, fetchEmergencyContact, updateEmergencyContact } from "../../lib/api";
import RouteOptionsComponent from "../../components/RouteOptionsComponent/RouteOptionsComponent";
import { useRoutePreferences } from "@/components/RoutePreferencesContext";

const VALID_SECTIONS = new Set([
  "profile",
  "change-password",
  "route-options",
  "emergency-contact",
]);

const SETTINGS_SECTIONS = new Set([
  "change-password",
  "route-options",
  "emergency-contact",
]);

const getSectionFromParams = (searchParams) => {
  const raw = searchParams.get("section");
  return VALID_SECTIONS.has(raw) ? raw : "profile";
};

const isSettingsSection = (section) => SETTINGS_SECTIONS.has(section);

export default function ProfilePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(() =>
    isSettingsSection(getSectionFromParams(searchParams))
  );
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [points, setPoints] = useState(0);
  const [distance, setDistance] = useState(0);
  const [dateJoined, setDateJoined] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(() => getSectionFromParams(searchParams));
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [profileMsg, setProfileMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  // Emergency Contact State
  const [emergencyContact, setEmergencyContact] = useState({ name: "", phone: "" });
  const [emergencyMsg, setEmergencyMsg] = useState(null);
  const [emergencyLoading, setEmergencyLoading] = useState(false);
  
  // Change password form state
  const [passwordValues, setPasswordValues] = useState({ current: "", newPass: "", repeat: "" });
  const [showPassword, setShowPassword] = useState({ current: false, newPass: false, repeat: false });
  const [passwordMsg, setPasswordMsg] = useState(null);
  
  // Route options state
  const [isTollRoadsOn, setIsTollRoadsOn] = useRoutePreferences();

  useEffect(() => {
    const nextSection = getSectionFromParams(searchParams);
    setActiveSection(nextSection);
    setSettingsOpen(isSettingsSection(nextSection));
  }, [searchParams]);

  useEffect(() => {
    async function loadUserData() {
      try {
        setLoading(true);
        const data = await fetchRewardAccount();
        setUsername(data.username ?? "Guest");
        setEmail(data.email ?? "");
        setPoints(Number(data.reward_points ?? 0));
        setDistance(Number(data.cumulative_distance ?? 0));
        setDateJoined(data.date_joined ? new Date(data.date_joined) : null);
        setEditUsername(data.username ?? "");
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        if (err.message.includes("Authentication failed")) {
          navigate("/", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    }
    async function loadEmergencyContact() {
        try {
            const contact = await fetchEmergencyContact();
            if (contact) {
                setEmergencyContact({
                    name: contact.name || "",
                    phone: contact.phone_number || "",
                });
            }
        } catch (err) {
            console.error("Failed to load emergency contact", err);
        }
    }
    loadUserData();
    loadEmergencyContact();
  }, [navigate]);

  const updateSection = (section) => {
    const nextParams = new URLSearchParams(searchParams);
    if (section === "profile") {
      nextParams.delete("section");
    } else {
      nextParams.set("section", section);
    }
    setActiveSection(section);
    if (isSettingsSection(section)) {
      setSettingsOpen(true);
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleLogout = () => {
    clearAuth();
    setShowLogoutConfirm(false);
    navigate("/", { replace: true });
  };

  // Change password handlers
  const handlePasswordChange = (e) =>
    setPasswordValues(v => ({ ...v, [e.target.name]: e.target.value }));
  
  const togglePasswordVisibility = (field) => 
    setShowPassword(s => ({ ...s, [field]: !s[field] }));

  const validatePassword = () => {
    if (!passwordValues.current || !passwordValues.newPass || !passwordValues.repeat) 
      return "Please fill in all fields.";
    if (passwordValues.newPass.length < 8) 
      return "New password must be at least 8 characters long.";
    // Check for at least one letter
    if (!/[a-zA-Z]/.test(passwordValues.newPass))
      return "New password must include at least one letter.";
    // Check for at least one number
    if (!/\d/.test(passwordValues.newPass))
      return "New password must include at least one number (0-9).";
    // Check for at least one special character
    if (!/[^a-zA-Z0-9]/.test(passwordValues.newPass))
      return "New password must include at least one special character.";
    if (passwordValues.newPass !== passwordValues.repeat) 
      return "The two new password entries do not match.";
    if (passwordValues.current === passwordValues.newPass) 
      return "New password cannot be the same as the current password.";
    return null;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const err = validatePassword();
    if (err) {
      setPasswordMsg({ type: "error", text: err });
      return;
    }

    try {
      const base = import.meta.env.VITE_API_URL || "";
      const res = await fetch(`${base}/api/change-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          current: passwordValues.current,
          newPass: passwordValues.newPass,
          repeat: passwordValues.repeat,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordMsg({ type: "success", text: data.detail });
        setPasswordValues({ current: "", newPass: "", repeat: "" });
      } else {
        setPasswordMsg({
          type: "error",
          text: Array.isArray(data.detail) ? data.detail.join(", ") : data.detail,
        });
      }
    } catch (err) {
      console.error(err);
      setPasswordMsg({ type: "error", text: "Network error. Check backend server." });
    }
  };

  const handleEmergencySave = async (e) => {
    e.preventDefault();
    setEmergencyMsg(null);
    setEmergencyLoading(true);

    if (!emergencyContact.name || !emergencyContact.phone) {
        setEmergencyMsg({ type: "error", text: "Please fill in both name and phone number." });
        setEmergencyLoading(false);
        return;
    }

    try {
        await updateEmergencyContact({
            name: emergencyContact.name,
            phone_number: emergencyContact.phone,
        });
        setEmergencyMsg({ type: "success", text: "Emergency contact updated successfully!" });
    } catch (err) {
        setEmergencyMsg({ type: "error", text: err.message || "Failed to update emergency contact." });
    } finally {
        setEmergencyLoading(false);
    }
  };


  const toggleTollRoads = () => {
    setIsTollRoadsOn(prev => !prev);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "change-password":
        return (
          <div className="profile-settings-content">
            <h2>Change Password</h2>
            
            {passwordMsg && (
              <div className={`profile-msg ${passwordMsg.type === "error" ? "error" : "success"}`}>
                {passwordMsg.text}
              </div>
            )}

            <form className="profile-form" onSubmit={handlePasswordSubmit}>
              <div className="profile-form-row">
                <label htmlFor="current-password">Current password</label>
                <div className="profile-input-group">
                  <input
                    id="current-password"
                    name="current"
                    type={showPassword.current ? "text" : "password"}
                    value={passwordValues.current}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="profile-toggle-btn"
                    onClick={() => togglePasswordVisibility("current")}
                  >
                    {showPassword.current ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <div className="profile-form-row">
                <label htmlFor="new-password">New password</label>
                <div className="profile-input-group">
                  <input
                    id="new-password"
                    name="newPass"
                    type={showPassword.newPass ? "text" : "password"}
                    value={passwordValues.newPass}
                    onChange={handlePasswordChange}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="profile-toggle-btn"
                    onClick={() => togglePasswordVisibility("newPass")}
                  >
                    {showPassword.newPass ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <div className="profile-form-row">
                <label htmlFor="repeat-password">Repeat password</label>
                <div className="profile-input-group">
                  <input
                    id="repeat-password"
                    name="repeat"
                    type={showPassword.repeat ? "text" : "password"}
                    value={passwordValues.repeat}
                    onChange={handlePasswordChange}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="profile-toggle-btn"
                    onClick={() => togglePasswordVisibility("repeat")}
                  >
                    {showPassword.repeat ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              <div className="profile-form-actions">
                <button 
                  type="button" 
                  className="profile-btn-secondary" 
                  onClick={() => {
                    setPasswordValues({ current: "", newPass: "", repeat: "" });
                    setPasswordMsg(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="profile-btn-primary">
                  Save Password
                </button>
              </div>
            </form>
          </div>
        );

      case "route-options":
        return (
          <div className="profile-settings-content">
            <h2>Default Route Options</h2>
            <RouteOptionsComponent isTollRoadsOn={isTollRoadsOn} toggleTollRoads={toggleTollRoads} />
          </div>
        );

      case "emergency-contact":
        return (
          <div className="profile-settings-content">
            <h2>Emergency Contact</h2>
            <p className="profile-description">
                Set a primary emergency contact. This number will be called when you use the Emergency Help button.
            </p>
            
            {emergencyMsg && (
              <div className={`profile-msg ${emergencyMsg.type === "error" ? "error" : "success"}`}>
                {emergencyMsg.text}
              </div>
            )}

            <form className="profile-form" onSubmit={handleEmergencySave}>
              <div className="profile-form-row">
                <label htmlFor="emergency-name">Contact Name</label>
                <div className="profile-input-group">
                  <input
                    id="emergency-name"
                    type="text"
                    value={emergencyContact.name}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })}
                    placeholder="e.g. Mum, Partner"
                  />
                </div>
              </div>

              <div className="profile-form-row">
                <label htmlFor="emergency-phone">Phone Number</label>
                <div className="profile-input-group">
                  <input
                    id="emergency-phone"
                    type="tel"
                    value={emergencyContact.phone}
                    onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })}
                    placeholder="e.g. 0400000000"
                  />
                </div>
              </div>

              <div className="profile-form-actions">
                <button 
                    type="submit" 
                    className="profile-btn-primary"
                    disabled={emergencyLoading}
                >
                  {emergencyLoading ? "Saving..." : "Save Contact"}
                </button>
              </div>
            </form>
          </div>
        );

      default: // "profile"
        return (
          <div className="profile-info-section">
            <h2>Profile Information</h2>
            
            {profileMsg && (
              <div className={`profile-msg ${profileMsg.type}`}>
                {profileMsg.text}
              </div>
            )}

            <div className="profile-info-card">
              <div className="profile-info-row">
                <span className="profile-info-label">Username</span>
                {isEditing ? (
                  <input
                    type="text"
                    className="profile-info-input"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                  />
                ) : (
                  <span className="profile-info-value">{loading ? "..." : username}</span>
                )}
              </div>
              
              <div className="profile-info-row">
                <span className="profile-info-label">Email</span>
                <span className="profile-info-value">{loading ? "..." : email}</span>
              </div>
              
              <div className="profile-info-row">
                <span className="profile-info-label">Reward Points</span>
                <span className="profile-info-value">{points.toLocaleString()}</span>
              </div>
              
              <div className="profile-info-row">
                <span className="profile-info-label">Total Distance</span>
                <span className="profile-info-value">{distance.toFixed(2)} km</span>
              </div>

              <div className="profile-info-row">
                <span className="profile-info-label">Emergency Contact</span>
                <span className="profile-info-value">
                  {emergencyContact.name ? (
                    <>{emergencyContact.name} <span className="text-gray-400 text-sm">({emergencyContact.phone})</span></>
                  ) : (
                    <span className="text-gray-400 italic">Not Set</span>
                  )}
                </span>
              </div>
              
              <div className="profile-info-row">
                <span className="profile-info-label">Member Since</span>
                <span className="profile-info-value">
                  {dateJoined ? dateJoined.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "..."}
                </span>
              </div>
            </div>

            <div className="profile-edit-actions">
              {isEditing ? (
                <>
                  <button className="profile-btn-secondary" onClick={() => { setIsEditing(false); setEditUsername(username); setProfileMsg(null); }}>
                    Cancel
                  </button>
                  <button 
                    className="profile-btn-primary" 
                    disabled={saving}
                    onClick={async () => {
                      try {
                        setSaving(true);
                        setProfileMsg(null);
                        const result = await updateProfile({ username: editUsername });
                        setUsername(result.username);
                        setIsEditing(false);
                        setProfileMsg({ type: "success", text: "Profile updated successfully!" });
                      } catch (err) {
                        setProfileMsg({ type: "error", text: err.message });
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button className="profile-btn-primary" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className="profile-page">
        <button
          className="profile-close-btn"
          aria-label="Close"
          onClick={() => navigate("/map")}
          title="Back to map"
          type="button"
        >
          <X size={24} />
        </button>

        <nav className="profile-left-nav" aria-label="Profile navigation">
          <h2 className="profile-nav-title">Menu</h2>
          
          {/* User Info Section */}
          <div className="profile-user-info">
            <div className="profile-avatar">
              {username ? username.charAt(0).toUpperCase() : "G"}
            </div>
            <div className="profile-user-details">
              <p className="profile-username">{loading ? "Loading..." : username}</p>
              <p className="profile-points">{points.toLocaleString()} Points</p>
            </div>
          </div>

          <ul className="profile-menu">
            <li>
              <button 
                className={`profile-menu-item ${activeSection === "profile" ? "active" : ""}`}
                onClick={() => updateSection("profile")}
              >
                Profile
              </button>
            </li>
            <li>
              <Link className="profile-menu-item" to="/rewards-page">
                Rewards
              </Link>
            </li>
            <li>
              <button
                className="profile-menu-item profile-settings-toggle"
                onClick={() => setSettingsOpen(!settingsOpen)}
                aria-expanded={settingsOpen}
              >
                <span>Settings</span>
                {settingsOpen ? (
                  <ChevronDown size={18} />
                ) : (
                  <ChevronRight size={18} />
                )}
              </button>
              {settingsOpen && (
                <ul className="profile-settings-submenu">
                  <li>
                    <button 
                      className={`profile-submenu-item ${activeSection === "change-password" ? "active" : ""}`}
                      onClick={() => updateSection("change-password")}
                    >
                      Change Password
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`profile-submenu-item ${activeSection === "route-options" ? "active" : ""}`}
                      onClick={() => updateSection("route-options")}
                    >
                      Default Route Options
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`profile-submenu-item ${activeSection === "emergency-contact" ? "active" : ""}`}
                      onClick={() => updateSection("emergency-contact")}
                    >
                      Emergency Contact
                    </button>
                  </li>
                </ul>
              )}
            </li>
          </ul>

          <button
            className="profile-menu-item profile-logout-btn"
            onClick={() => setShowLogoutConfirm(true)}
          >
            Log Out
          </button>
        </nav>

        <div className="profile-content">
          {renderContent()}
        </div>
      </div>

      {showLogoutConfirm && createPortal(
        <div className="profile-logout-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="profile-logout-box" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="profile-logout-actions">
              <button
                className="profile-btn-cancel"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="profile-btn-confirm"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
