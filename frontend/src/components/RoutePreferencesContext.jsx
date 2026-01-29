import { createContext, useContext, useState, useEffect } from "react";

export const RoutePreferencesContext = createContext({ 
    isTollRoadsOn: false, 
    setIsTollRoadsOn: () => {} 
});

export function RoutePreferencesProvider({ children }) {
    const [isTollRoadsOn, setIsTollRoadsOn] = useState(() => {
        // initialize from localStorage or default
        const stored = localStorage.getItem("tollRoads");
        return stored === null ? true : stored === "true";
    });

    useEffect(() => {
        localStorage.setItem("tollRoads", isTollRoadsOn.toString());
    }, [isTollRoadsOn]);

    return (
        <RoutePreferencesContext.Provider value={{ isTollRoadsOn, setIsTollRoadsOn }}>
            {children}
        </RoutePreferencesContext.Provider>
    );
}

export function useRoutePreferences() {
    const context = useContext(RoutePreferencesContext);
    if (!context) {
        throw new Error("useRoutePreferences must be used inside RoutePreferencesProvider");
    }
    return context;
}