import "./RouteOptionsComponent.css"

export default function RouteOptionsComponent({ isTollRoadsOn, toggleTollRoads }) {
    return (
            <div className="routeOptions">
                <h1>Route Options</h1>
                <div className="tollRoadToggle">
                    <div>Avoid toll roads?</div>
                    <div
                        className={`toggleTollRoads ${isTollRoadsOn ? "on" : ""}`}
                        onClick={toggleTollRoads}
                    >
                        <div className="toggleTollRoadsKnob" />
                    </div>
                </div>
            </div>
    );
}
