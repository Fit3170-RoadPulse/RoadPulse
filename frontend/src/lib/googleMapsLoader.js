import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let didSetOptions = false;
let optionsSignature = "";

export const ensureMapsLoaderOptions = (apiKey, mapId) => {
  if (!apiKey) return false;
  const signature = JSON.stringify({ apiKey, mapId });
  if (!didSetOptions) {
    const nextOptions = { key: apiKey };
    if (mapId) nextOptions.mapIds = [mapId];
    setOptions(nextOptions);
    didSetOptions = true;
    optionsSignature = signature;
    return true;
  }
  if (signature !== optionsSignature) {
    console.warn("[googleMapsLoader] Loader options already set; new values ignored.");
  }
  return true;
};

export const loadMapsLibrary = async (library, apiKey, mapId) => {
  const ready = ensureMapsLoaderOptions(apiKey, mapId);
  if (!ready) return null;
  try {
    return await importLibrary(library);
  } catch (err) {
    console.warn(`[googleMapsLoader] Failed to load ${library} library`, err);
    return null;
  }
};
