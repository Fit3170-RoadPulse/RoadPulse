import {BrowserRouter as Router, Route, Routes, Navigate} from 'react-router-dom';
import Home from "./pages/Home"
import Map from "./pages/Map"
import NotFound from "./pages/NotFound"

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/map" element={<Map />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    </Router>
  )
}

export default App;
