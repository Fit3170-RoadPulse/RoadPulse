export default function MapComponent({ API_KEY }) {
  function initMap() {
    const center = { lat: -34.397, lng: 150.644 };
    const map = new google.maps.Map(document.getElementById("map"), {
      zoom: 8,
      center: center,

      // enable map/satellite toggle and put it bottom-right
      mapTypeControl: true,
      mapTypeControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },

      // street view button → bottom-left (example)
      streetViewControl: true,
      streetViewControlOptions: {
        position: google.maps.ControlPosition.RIGHT_BOTTOM,
      },
    });

    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
  }

  window.initMap = initMap;

  return (
    <div className="mapholder" style={{ width: "100%", height: "100%" }}>
      <div id="map" style={{ width: "100%", height: "100%" }}></div>
      <script
        async
        src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap`}
      ></script>
    </div>
  );
}
