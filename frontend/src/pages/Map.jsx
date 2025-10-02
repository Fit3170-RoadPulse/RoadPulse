import { Link } from 'react-router-dom';
import {useEffect, useState} from "react"
import MapComponent from '../components/map-component';
import axios from "axios"

function Map() {
    const [mapData, setMapData] = useState(null)

    useEffect(() => {
        const base = import.meta.env.VITE_API_URL || ""
        axios.get(`${base}/api/map/`).then(r => setMapData(r.data))
    }, [])

    console.log("Map Data", mapData)
    return (
        <div style = {{width: '100vw', height: '100vh', position: 'relative'}}>
            <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}>
                <MapComponent API_KEY={mapData?.GMAPS_KEY}/>
            </div>

            <h1 style={{position: 'absolute', top: '3rem', left: '0rem', backgroundColor: 'white', padding: '1rem 1rem 1rem 1rem', borderRadius: '0rem 0.5rem 0.5rem 0rem'}}>Map Page</h1>
            <div style={{position: 'absolute', top: '13rem', left: '1rem', backgroundColor: 'grey', padding: '0.5rem 1rem', borderRadius: '0.5rem', color: 'white'}}>
                <Link to="/home">Go home</Link>
            </div>
        </div>
    );
}

export default Map;