import "./Report.css"
import { useEffect, useState } from "react";
import axios from "axios";
import MapComponent from "../../components/MapComponent/MapComponent";
import MapPage from "../../components/MapSideBarComponent/MapSideBarComponent";
import ReportComponent from "@/components/ReportComponent/ReportComponent";

export default function Report(){
    let [isClicked, setIsClicked] = useState(null);
    let [mapData, setMapData] = useState(null);
    useEffect(() => {
        const base = import.meta.env.VITE_API_URL || "";
        axios.get(`${base}/api/map/`).then((r) => {
            setMapData(r.data)
        });
    }, []);
    console.log(mapData);

    async function ReportLocation(map){
        let originMarker = null;
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        map.addListener("click", (e) =>{
            setIsClicked(true);
            const centerPos= { lat: e.latLng.lat(), lng: e.latLng.lng() };

            // Remove previous marker if it exist
            if (originMarker){
                originMarker.map = null;
            }

            // Add marker at location
            originMarker = new AdvancedMarkerElement({
                map: map,
                position: centerPos,
                title:"A",
            });

            // Center position and zoom
            map.setCenter(centerPos);
            map.setZoom(14);

            map.addListener("center_changed", (e) => {
                setIsClicked(false);
                google.maps.event.clearListeners(map, 'center_changed');
            });
        });
    };

    return(
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
                <MapComponent API_KEY={mapData?.GMAPS_KEY} MAP_ID={mapData?.GMAPS_ID} map_function={ReportLocation}/>
            </div>
            <div style = {{
                zIndex: isClicked? 10: 0, 
                position: "absolute", 
                top: 0, 
                left: "60vw", 
                width: "35vw", 
                height: "100vh", 
                display: "flex",
                justifyContent: "center",
                }}> 
                <div style = {{
                    display: "flex",
                    justifyContent:"center",
                    flexDirection: "column",
                    width:"100%",
                    height:"100%"
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "center",
                        height: "50vh",
                        width: "100%"
                    }}>  
                        {(()=>{
                            if (isClicked){
                                return (
                                    <ReportComponent></ReportComponent>
                                );
                            }
                        })()} 
                    </div> 
                </div>              
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