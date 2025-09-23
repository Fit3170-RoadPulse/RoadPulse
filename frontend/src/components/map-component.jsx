export default function MapComponent({ API_KEY }) {
    let map;
    let originMarker = null;
    let destinationMarker = null;
    let directionsRenderer = null;


    function initMap() {
        const center = { lat: -34.397, lng: 150.644 };
        map = new google.maps.Map(document.getElementById("map"), {
            zoom: 8,
            center: center,
        });

        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);

        directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        map.addListener("click", (e) =>{
            const clicked = { lat: e.latLng.lat(), lng: e.latLng.lng() };

            if (!originMarker){
                originMarker = new google.maps.marker.AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title:"A",
                });
                directionsRenderer.set("directions",null);
            }else if (!destinationMarker){
                destinationMarker = new google.maps.marker.AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title:"B",
                });
                buildRoute(originMarker.position,destinationMarker.position);
        } else{
            originMarker.map = null;
            destinationMarker.map =null;
            directionsRenderer.set("directions",null);

            originMarker = new google.maps.marker.AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title:"A",
                });
                destinationMarker = null;
        }
    });
    }

    function buildRoute(origin,destination){
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
            {
                origin,
                destination,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) =>{
                if (status === "OK"){
                    directionsRenderer.setDirections(result) 
                } else{
                    console.error("Direction request failed:" + status)
                }
            }
        )
    }

    window.initMap = initMap;
    return (
        <div className="mapholder" style={{ width: '100%', height: '100%' }}>
            <script src = "https://polyfill.io/v3/polyfill.min.js?features=default"></script>
            <div id="map" style={{width: '100%', height: '100%' }}></div>
            <script
                async 
                src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap&libraries=maps,marker`}
            ></script>
        </div>
    );
}