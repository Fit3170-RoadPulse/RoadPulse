export default function MapComponent({ API_KEY }) {
    let map;

    function initMap() {
        const center = { lat: -34.397, lng: 150.644 };
        map = new google.maps.Map(document.getElementById("map"), {
            zoom: 8,
            center: center,
        });

        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);
    }

    window.initMap = initMap;
    return (
        <div class="mapholder" style={{ width: '100%', height: '100%' }}>
            <script src = "https://polyfill.io/v3/polyfill.min.js?features=default"></script>
            <div id="map" style={{width: '100%', height: '100%' }}></div>
            <script
                async 
                src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap`}
            ></script>
        </div>
    );
}