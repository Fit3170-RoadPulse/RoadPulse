import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css'
import App from './App.jsx'
import LoginPage from "./pages/loginpage/Login.jsx";
import SettingMenu from './pages/settingpage/menu/SettingMenu.jsx';
import ChangePassword from "./pages/settingpage/changepassword/ChangePassword.jsx";
import MapPage from './pages/mappage/MapPage.jsx';



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login-page" element={<LoginPage />} />
        <Route path="/setting-menu-page" element={<SettingMenu />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/map-page" element={<MapPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
