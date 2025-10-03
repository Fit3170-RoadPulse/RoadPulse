import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css'
import App from './App.jsx'
import LoginPage from "./pages/loginpage/Login.jsx";
import SettingMenu from './pages/settingpage/menu/SettingMenu.jsx';
import ChangePassword from "./pages/settingpage/changepassword/ChangePassword.jsx";
import MapPage from './pages/mappage/MapPage.jsx';
import Map from "./pages/Map"
import NotFound from "./pages/NotFound"
import Emergency from './pages/Emergency.jsx';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* If you want to navigate to a page via filepath, I think you must include the route here */}
        <Route path="/" element={<App />} />
        <Route path="/login-page" element={<LoginPage />} />
        <Route path="/setting-menu-page" element={<SettingMenu />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/map-page" element={<MapPage />} />
        <Route path="/map" element={<Map />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/Emergency" element={<Emergency />} /> 
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
