import React, { useEffect, useRef, useState } from "react";
import "./MapSideBarComponent.css";
import MapIcon from "../../assets/map.png";
import PhoneCallIcon from "../../assets/phone-call.png";
import RouteIcon from "../../assets/route.png";
import ReportIcon from "../../assets/report.png";
import SearchIcon from "../../assets/search.png";
import { Star } from "lucide-react";
import GoIcon from "../../assets/go.png";
import ProfileIcon from "../../assets/profile.png";
import { loadMapsLibrary } from "../../lib/googleMapsLoader";


export default function MapPage({
  onSearch,
  onPlaceSelected,
  showRouteUI = false,
  userLocation = null,
  mapData = null,
  showSearch = true,
  onSavedDestinationsClick = null,
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [useNativeAutocomplete, setUseNativeAutocomplete] = useState(false);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const placesRef = useRef(null);
  const autocompleteRef = useRef(null);
  const autocompleteListenerRef = useRef(null);
  const debounceRef = useRef(null);

  const ensurePlaces = async () => {
    if (placesRef.current) return placesRef.current;
    const apiKey = mapData?.GMAPS_KEY;
    const mapId = mapData?.GMAPS_ID;
    let library = null;
    if (apiKey) {
      library = await loadMapsLibrary("places", apiKey, mapId);
    }
    const g = window.google;
    const AutocompleteService =
      library?.AutocompleteService || g?.maps?.places?.AutocompleteService;
    const PlacesService =
      library?.PlacesService || g?.maps?.places?.PlacesService;
    if (!AutocompleteService || !PlacesService) return null;
    const service = new AutocompleteService();
    const detailsService = new PlacesService(document.createElement("div"));
    placesRef.current = { service, detailsService };
    return placesRef.current;
  };

  const resolveApiBase = () => {
    const envBase = import.meta.env.VITE_API_URL;
    if (envBase) return envBase;
    if (typeof window === "undefined") return "";
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:8000`;
  };

  const fetchServerSuggestions = async (searchQuery, lat, lng) => {
    const base = resolveApiBase();
    const params = new URLSearchParams({ q: searchQuery });
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      params.set("lat", lat.toString());
      params.set("lng", lng.toString());
    }
    if (!base) return [];
    const response = await fetch(`${base}/api/map/autocomplete/?${params.toString()}`);
    if (!response.ok) return [];
    const data = await response.json();
    const list = Array.isArray(data?.predictions) ? data.predictions : [];
    return list.map((item) => ({
      place_id: item.place_id || item.description,
      description: item.description,
      structured_formatting: item.structured_formatting,
      location: item.location,
    }));
  };

  const requestSuggestions = async (searchQuery) => {
    const lat = Number(userLocation?.lat ?? userLocation?.latitude);
    const lng = Number(userLocation?.lng ?? userLocation?.longitude);
    const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);
    const places = await ensurePlaces();

    if (places) {
      const request = hasLocation
        ? { input: searchQuery, location: { lat, lng }, radius: 30000 }
        : { input: searchQuery };
      const predictions = await new Promise((resolve) => {
        places.service.getPlacePredictions(
          request,
          (results, status) => {
            if (status !== "OK" || !results) {
              resolve([]);
              return;
            }
            resolve(results);
          }
        );
      });
      if (predictions.length) return predictions;
    }

    try {
      const serverSuggestions = await fetchServerSuggestions(
        searchQuery,
        hasLocation ? lat : null,
        hasLocation ? lng : null
      );
      if (serverSuggestions.length) return serverSuggestions;
    } catch (_) {
      // ignore and fall back
    }

    const geocoder = window.google?.maps?.Geocoder ? new window.google.maps.Geocoder() : null;
    if (!geocoder) return [];
    const geoRequest = hasLocation
      ? { address: searchQuery, location: { lat, lng } }
      : { address: searchQuery };
    const geocodeResults = await new Promise((resolve) => {
      geocoder.geocode(geoRequest, (results, status) => {
        if (status !== "OK" || !results) {
          resolve([]);
          return;
        }
        resolve(results.slice(0, 6));
      });
    });
    return geocodeResults.map((result) => ({
      place_id: result.place_id || result.formatted_address,
      description: result.formatted_address,
      structured_formatting: {
        main_text: result.address_components?.[0]?.long_name || result.formatted_address,
        secondary_text: result.formatted_address,
      },
      __place: {
        geometry: result.geometry,
        name: result.address_components?.[0]?.long_name || result.formatted_address,
        formatted_address: result.formatted_address,
      },
    }));
  };

  useEffect(() => {
    if (!mapData?.GMAPS_KEY && !window?.google?.maps?.places) return;
    ensurePlaces();
  }, [mapData?.GMAPS_KEY, mapData?.GMAPS_ID]);

  useEffect(() => {
    let cancelled = false;

    const initAutocomplete = async () => {
      if (!inputRef.current || autocompleteRef.current) return;
      const apiKey = mapData?.GMAPS_KEY;
      const mapId = mapData?.GMAPS_ID;
      let library = null;
      try {
        if (window.google?.maps?.importLibrary) {
          library = await window.google.maps.importLibrary("places");
        } else if (apiKey) {
          library = await loadMapsLibrary("places", apiKey, mapId);
        }
      } catch (_) {
        library = null;
      }
      const g = window.google;
      const AutocompleteCtor = library?.Autocomplete || g?.maps?.places?.Autocomplete;
      if (!AutocompleteCtor || !inputRef.current || cancelled) return;
      const autocomplete = new AutocompleteCtor(inputRef.current, {
        fields: ["geometry", "name", "formatted_address"],
      });
      autocompleteRef.current = autocomplete;
      setUseNativeAutocomplete(true);
      const listener = autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace?.();
      if (!place?.geometry?.location) return;
      setShowSuggestions(false);
      if (typeof onPlaceSelected === "function") onPlaceSelected(place);
      setQuery("");
    });
      autocompleteListenerRef.current = listener;
    };

    initAutocomplete();

    return () => {
      cancelled = true;
      if (autocompleteListenerRef.current?.remove) {
        autocompleteListenerRef.current.remove();
      }
      autocompleteListenerRef.current = null;
      autocompleteRef.current = null;
      setUseNativeAutocomplete(false);
    };
  }, [mapData?.GMAPS_KEY, mapData?.GMAPS_ID, onPlaceSelected]);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const className = "rp-map-type-menu-open";
    const infoClassName = "rp-map-info-open";
    const routeClassName = "rp-route-ui-open";

    const isElementVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    };

    const updateMenuState = () => {
      const menus = document.querySelectorAll(".gm-style-mtc ul[role='menu']");
      let isOpen = false;
      menus.forEach((menu) => {
        const style = window.getComputedStyle(menu);
        if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
          isOpen = true;
        }
      });
      document.body.classList.toggle(className, isOpen);

      const searchDropdownVisible = !!document.querySelector(".search-suggestions");
      const pacContainer = document.querySelector(".pac-container");
      const pacVisible = isElementVisible(pacContainer);
      document.body.classList.toggle("rp-search-open", searchDropdownVisible || pacVisible);

      const infoWindows = document.querySelectorAll(
        ".gm-style-iw, .gm-style-iw-c, .gm-style-iw-d, .gm-style-iw-t, .gm-style-iw-a, [class*='gm-style-iw']"
      );
      let infoOpen = false;
      infoWindows.forEach((node) => {
        if (isElementVisible(node)) infoOpen = true;
      });
      document.body.classList.toggle(infoClassName, infoOpen);

      const routeNodes = document.querySelectorAll(".route-info-container, .route-info-card");
      let routeOpen = false;
      routeNodes.forEach((node) => {
        if (isElementVisible(node)) routeOpen = true;
      });
      document.body.classList.toggle(routeClassName, showRouteUI || routeOpen);
    };

    updateMenuState();
    const observer = new MutationObserver(updateMenuState);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["style", "class", "aria-expanded", "aria-hidden"],
    });
    const intervalId = window.setInterval(updateMenuState, 250);
    window.addEventListener("resize", updateMenuState);

    return () => {
      observer.disconnect();
      window.clearInterval(intervalId);
      window.removeEventListener("resize", updateMenuState);
      document.body.classList.remove(className);
      document.body.classList.remove(infoClassName);
      document.body.classList.remove(routeClassName);
    };
  }, [showRouteUI]);

  useEffect(() => {
    document.body.classList.toggle("rp-search-open", showSuggestions);
  }, [showSuggestions]);

  useEffect(() => {
    const handler = (event) => {
      if (!searchRef.current) return;
      if (!searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!showSearch) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (useNativeAutocomplete) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      const results = await requestSuggestions(query);
      if (!results.length) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      setSuggestions(results);
      setShowSuggestions(true);
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, userLocation, mapData?.GMAPS_KEY, mapData?.GMAPS_ID, useNativeAutocomplete, showSearch]);

  const handleSelectSuggestion = async (suggestion) => {
    const fallbackPlace = suggestion?.__place;
    if (fallbackPlace?.geometry?.location) {
      setShowSuggestions(false);
      if (typeof onPlaceSelected === "function") onPlaceSelected(fallbackPlace);
      setQuery("");
      return;
    }
    if (suggestion?.location) {
      const place = {
        geometry: { location: suggestion.location },
        name: suggestion.structured_formatting?.main_text || suggestion.description,
        formatted_address: suggestion.description,
      };
      setShowSuggestions(false);
      if (typeof onPlaceSelected === "function") onPlaceSelected(place);
      setQuery("");
      return;
    }
    const places = await ensurePlaces();
    if (!places) return;
    places.detailsService.getDetails(
      { placeId: suggestion.place_id, fields: ["geometry", "name", "formatted_address"] },
      (place, status) => {
        if (status !== "OK" || !place?.geometry?.location) return;
        setShowSuggestions(false);
        if (typeof onPlaceSelected === "function") onPlaceSelected(place);
        setQuery("");
      }
    );
  };

  return (
    <div className="overlay"> {/* <- positioned and non-blocking by default */}
      <div className="map-page">
        <div className="sidebar">
          <span className="sidebar-emoji">🚦</span>

          <button className="sidebar-button sidebar-button-clickable"
            onClick={() => (window.location.href = "/map")}>
            <img src={MapIcon} alt="Map" />
            <span>Map</span>
          </button>

          <button className="sidebar-button sidebar-button-clickable"
            onClick={() => (window.location.href = "/Emergency")}>
            <img src={PhoneCallIcon} alt="Emergency" />
            <span>Emergency</span>
          </button>

          <button className="sidebar-button sidebar-button-clickable"
            onClick={() => (window.location.href = "/report")}>
            <img src={ReportIcon} alt="Reports" />
            <span>Reports</span>
          </button>

          <button className="sidebar-button sidebar-button-clickable"
            onClick={() => (window.location.href = "/profile-page")}>
            <img src={ProfileIcon} alt="Profile" />
            <span>Profile</span>
          </button>

        </div>
        

        {showSearch && (
          <div className="content">
            <div className="search-bar-row">
              <div className="search-bar" ref={searchRef}>
                <div className="search-icon">
                  <img src={SearchIcon} alt="Search" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="search-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  ref={inputRef}
                />
                <img
                  src={GoIcon}
                  alt="Go"
                  className="go-icon"
                  onClick={async () => {
                    if (!query || query.trim().length < 2) return;
                    if (useNativeAutocomplete) {
                      inputRef.current?.focus();
                      onSearch?.();
                      return;
                    }
                    const results = await requestSuggestions(query.trim());
                    if (!results.length) {
                      setSuggestions([]);
                      setShowSuggestions(false);
                      return;
                    }
                    setSuggestions(results);
                    setShowSuggestions(true);
                    onSearch?.();
                  }}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="search-suggestions">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        className="search-suggestion"
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        <span className="search-suggestion-main">
                          {suggestion.structured_formatting?.main_text || suggestion.description}
                        </span>
                        {suggestion.structured_formatting?.secondary_text && (
                          <span className="search-suggestion-secondary">
                            {suggestion.structured_formatting.secondary_text}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {onSavedDestinationsClick && (
                <button
                  type="button"
                  className="saved-destinations-quick"
                  onClick={onSavedDestinationsClick}
                  aria-label="Open saved destinations"
                >
                  <Star className="saved-destinations-quick-icon" size={18} strokeWidth={2.5} />
                  <span>Saved</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
