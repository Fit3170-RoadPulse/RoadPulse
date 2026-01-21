import { Geolocation } from '@capacitor/geolocation';

// Fallback mock location (used if real geolocation fails)
const mockLocation = {
    latitude: -37.813904798147796,
    longitude: 144.98810008133233,
    accuracy: 50,
    timestamp: Date.now(),
};

export class NativeGeolocationProvider {
    watchId;

    async start(prevLocationRef, locationPollingData, cb) {
        console.log("Starting mobile geolocation");

        const perm = await Geolocation.requestPermissions();
        if (perm.location !== 'granted') {
            console.error("Location permission not granted");
            return;
        }
        
        this.watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true },
        (pos) => {
            if (!pos) return;
            const now = Date.now();
            const newLocation = {
                latitude: pos?.coords?.latitude,
                longitude: pos?.coords?.longitude,
                accuracy: pos?.coords?.accuracy,
                timestamp: pos?.timestamp,
            };
            cb.bind(null, newLocation, now);
        }
        );
    }

    stop() {
        Geolocation.clearWatch({ id: this.watchId });
    }
}

export class WebGeolocationProvider {
    intervalID = null;

    start(prevLocationRef, locationPollingData, cb) {

        if (!navigator?.geolocation) {
            console.warn("Geolocation is not supported by this browser.");
            return;
        }
        // Success handler: updates the state with the new position
        const successHandler = (position) => {
            console.log(position);
            const now = Date.now();
            const newLocation = {
                latitude: position?.coords?.latitude,
                longitude: position?.coords?.longitude,
                accuracy: position?.coords?.accuracy,
                timestamp: position?.timestamp,
            };
            console.log("Location updated:", newLocation);
            prevLocationRef.current = newLocation;

            cb.bind(null, newLocation, now);
        };

        // Error handler: updates the error state
        const errorHandler = (err) => {
            console.error("Geolocation error:", {
                code: err.code,
                message: err.message,
            });
            prevLocationRef.current = mockLocation;
            console.log("Location updated:", mockLocation);
        };

        // Options object for watchPosition (optional)
        const options = {
            enableHighAccuracy: locationPollingData.current?.enableHighAccuracy ?? true,
            timeout: locationPollingData.current?.timeout ?? 10000,
            maximumAge: locationPollingData.current?.maximumAge ?? 0,
        };
        console.log("Starting web geolocation");
        this.intervalID = navigator.geolocation.watchPosition(
            successHandler,
            errorHandler,
            options
        );
    }

    stop() {
        if (this.intervalID != null && navigator?.geolocation) {
            navigator.geolocation.clearWatch(this.intervalID);
            this.intervalID = null;
        }
    }
}