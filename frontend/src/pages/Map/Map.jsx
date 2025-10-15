import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import MapComponent from "../../components/MapComponent/MapComponent";
import MapPage from "../../components/MapSideBarComponent/MapSideBarComponent";
// import "../components/side-bar-component/MapPage.css"; // reuse styles
import "./Map.css"

function Map() {
  const [mapData, setMapData] = useState(null);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || "";
    axios.get(`${base}/api/map/`).then((r) => setMapData(r.data));
  }, []);

  return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: '100px', 
                right: 0, 
                bottom: 0, 
                zIndex: 1,
                pointerEvents: "auto"
                }}>
                <MapComponent API_KEY={mapData?.GMAPS_KEY} MAP_ID={mapData?.GMAPS_ID} />
            </div>

            {/* Overlay UI */}
            <div className="overlay-ui" 
            style={{
            pointerEvents: "none"
            }}>  {/* Set pointerEvents to Auto so Google maps doesn't eat all the clicks above the UI region*/}
                <MapPage onSearch={() => console.log("Search triggered!")} />
            </div>
        </div>
    ); 
}

export default Map;
