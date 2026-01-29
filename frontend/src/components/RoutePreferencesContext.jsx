import { createContext, useContext, useState, useEffect } from "react";

export const RoutePreferencesContext = createContext({ 
    isTollRoadsOn: false, 
    setIsTollRoadsOn: () => {} 
});

export function RoutePreferencesProvider({ children }) {
  const [isTollRoadsOn, setIsTollRoadsOn] = useState(() => {
    try {
      const stored = localStorage.getItem("tollRoads");
      return stored === null ? true : stored === "true";
    } catch (err) {
      console.warn("localStorage not available", err);
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("tollRoads", isTollRoadsOn.toString());
    } catch (err) {
      console.warn("Failed to write to localStorage", err);
    }
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