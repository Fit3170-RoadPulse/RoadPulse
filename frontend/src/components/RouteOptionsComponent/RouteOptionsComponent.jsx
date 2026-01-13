import "./RouteOptionsComponent.css"

export default function RouteOptionsComponent({isTollRoadsOn, toggleTollRoads}) {
    return (<div class="routeOptions">
                <h1>Route Options</h1>
                <div class="tollRoadToggle">
                    <div>Enable toll roads?</div>
                    <div
                        className={`toggleTollRoads ${isTollRoadsOn ? "on" : ""}`}
                        onClick={toggleTollRoads}
                    >
                        <div className="toggleTollRoadsKnob" />
                    </div>
                </div>
            </div>
    )
}