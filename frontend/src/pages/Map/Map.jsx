import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import MapComponent from "../../components/MapComponent/MapComponent";
import MapPage from "../../components/MapSideBarComponent/MapSideBarComponent";
import "./Map.css"

export default function Map() {
    let mapData;
    useEffect(() => {
        const base = import.meta.env.VITE_API_URL || "";
        axios.get(`${base}/api/map/`).then((r) => {
            console.log(r.data);
            mapData = r.data;
            console.log(r.data);
            console.log(mapData);
        });
    }, []);

    async function setMarker(map){
        let originMarker = null;
        let directionsRenderer = null;
        let trafficLayer = null;
        let destinationMarker = null;
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        trafficLayer = new google.maps.TrafficLayer();
        trafficLayer.setMap(map);

        directionsRenderer = new google.maps.DirectionsRenderer();
        directionsRenderer.setMap(map);

        map.addListener("click", (e) =>{
            const clicked = { lat: e.latLng.lat(), lng: e.latLng.lng() };

            if (!originMarker){
                originMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title:"A",
                });
                directionsRenderer.setDirections(null);
            }else if (!destinationMarker){
                destinationMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title:"B",
                });
                buildRoute(originMarker.position,destinationMarker.position, directionsRenderer);
            } else{
                originMarker.map = null;
                destinationMarker.map =null;
                directionsRenderer.setDirections(null);

                originMarker = new AdvancedMarkerElement({
                    map: map,
                    position: clicked,
                    title:"A",
                });
                destinationMarker = null;
            }
        });
    }

    function buildRoute(origin,destination,directionsRenderer){
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
                <MapComponent API_KEY={mapData?.GMAPS_KEY} MAP_ID={mapData?.GMAPS_ID} map_function={setMarker}/>
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