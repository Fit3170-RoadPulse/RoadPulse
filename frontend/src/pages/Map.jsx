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
        <div>
            <h1>Map Page</h1>
            <Link to="/home">Go home</Link>
            <MapComponent API_KEY={mapData?.GMAPS_KEY} />
        </div>
    );
}

export default Map;