import "./MapComponent.css"

export default function MapComponent({ API_KEY , MAP_ID, map_function}) {
    let map;
    async function initMap() {

        const { Map } = await google.maps.importLibrary("maps");

        const center = { lat: -34.397, lng: 150.644 };
        map = new Map(document.getElementById("map"), {
            zoom: 8,
            center: center,
            mapId: MAP_ID
        });
        map_function(map);
    }
    
    window.initMap = initMap;
    return (
        <div className="mapholder" style={{ width: '100%', height: '100%' }}>
            <script src = "https://polyfill.io/v3/polyfill.min.js?features=default"></script>
            <div id="map" style={{width: '100%', height: '100%', minHeight: '400px' }}></div>
            <script
                async 
                defer
                src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap&v=weekly`}
            ></script>
        </div>
    );
}
