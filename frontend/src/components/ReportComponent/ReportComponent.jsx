import "./ReportComponent.css"

export default function ReportComponent() {
    async function initReport() {
    }

    return (
        <div className="mapholder" style={{ width: '100%', height: '100%' }}>
            <script src = "https://polyfill.io/v3/polyfill.min.js?features=default"></script>
            <div id="map" style={{width: '100%', height: '100%', minHeight: '400px' }}></div>
            <script
                async 
                src={`https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initMap&v=weekly`}
            ></script>
        </div>
    );
}