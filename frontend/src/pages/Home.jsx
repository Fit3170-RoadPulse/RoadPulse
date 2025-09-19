import { useEffect, useState } from "react"
import { Link } from 'react-router-dom';
import axios from "axios"

function Home() {
    const [health, setHealth] = useState(null)
    const [samples, setSamples] = useState([])

    useEffect(() => {
        const base = import.meta.env.VITE_API_URL || ""
        axios.get(`${base}/api/health/`).then(r => setHealth(r.data))
        axios.get(`${base}/api/samples/`).then(r => setSamples(r.data))
    }, [])

    return (
        <div style={{ padding: 24 }}>
            <h1>RoadPulse</h1>
            <h2>API Health</h2>
            <pre>{JSON.stringify(health, null, 2)}</pre>
            <h2>Samples</h2>
            <pre>{JSON.stringify(samples, null, 2)}</pre>

            <Link to="/map">Go to Map</Link>
        </div>
    );
}

export default Home;