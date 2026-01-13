import { useNavigate } from "react-router-dom";
import MapController from "./MapController";

export default function Map() {
    const navigate = useNavigate();

    return (
        <MapController navigate={navigate} />
    );
}
