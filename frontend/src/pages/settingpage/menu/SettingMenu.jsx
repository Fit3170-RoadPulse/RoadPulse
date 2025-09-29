// // src/pages/settingpage/menu/SettingMenu.jsx
// import React from "react";
// import { Link } from "react-router-dom";
// import "./SettingMenu.css";

// function SidebarIcon({ children }) {
//   return <div className="sidebar-icon">{children}</div>;
// }

// export default function SettingMenu() {
//   return (
//     <div className="setting-menu-page">
//       <nav className="settings-left-nav">
//         <div className="settings-header">
//           <div className="settings-badge">
//             <svg viewBox="0 0 24 24" width="18" height="18">
//               <path d="M12 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
//               <path d="M5 7l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
//               <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.2" fill="none" />
//             </svg>
//           </div>
//         </div>

//         <ul className="settings-menu">
//           <li className="menu-item">
//             <Link to="/change-password">Change Password</Link>
//           </li>
//           <li className="menu-item">
//             <Link to="/preferences">Preferences</Link>
//           </li>
//           <li className="menu-item">
//             <Link to="/display">Display</Link>
//           </li>
//           <li className="menu-item">
//             <Link to="/saved-places">My Saved Places</Link>
//           </li>
//           <li className="menu-item">
//             <Link to="/help">Help and Service</Link>
//           </li>
//         </ul>

//         <div className="settings-logout">Log Out</div>
//       </nav>
//     </div>
//   );
// }

import React from "react";
import { Link } from "react-router-dom";
import "./SettingMenu.css";

export default function SettingMenu() {
  return (
    <div className="settings-page">
      {/* 直接保留左侧主导航 */}
      <nav className="settings-left-nav" aria-label="Settings navigation">
        <div className="settings-header">
          <div className="settings-badge">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M12 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 7l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
            <span style={{ marginLeft: 6 }}>Settings</span>
          </div>
        </div>

        <ul className="settings-menu">
          <li className="menu-item"><Link to="/change-password">Change Password</Link></li>
          <li className="menu-item"><Link to="/preferences">Preferences</Link></li>
          <li className="menu-item"><Link to="/display">Display</Link></li>
          <li className="menu-item"><Link to="/saved-places">My Saved Places</Link></li>
          <li className="menu-item"><Link to="/help">Help and Service</Link></li>
        </ul>

        <div className="settings-logout">Log Out</div>
      </nav>

      {/* 内容区 */}
      <main className="settings-content" role="main">
        <h2>Account settings</h2>
        <section className="settings-panel">
          <p>这里放具体设置内容</p>
        </section>
      </main>
    </div>
  );
}
