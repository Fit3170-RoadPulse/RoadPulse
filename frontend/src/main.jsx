import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './index.css'
import App from './App.jsx'
import LoginPage from "./pages/LoginPage/Login.jsx";
import SettingMenu from './pages/SettingPage/menu/SettingMenu.jsx';
import ChangePassword from "./pages/SettingPage/changepassword/ChangePassword.jsx";
import Map from "./pages/Map/Map.jsx"
import NotFound from "./pages/NotFound/NotFound.jsx"
import Emergency from './pages/Emergency/Emergency.jsx';


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* If you want to navigate to a page via filepath, I think you must include the route here */}
        <Route path="/" element={<App />} />
        <Route path="/login-page" element={<LoginPage />} />
        <Route path="/setting-menu-page" element={<SettingMenu />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/map" element={<Map />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/Emergency" element={<Emergency />} /> 
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
