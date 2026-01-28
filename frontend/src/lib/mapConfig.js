let cachedMapConfig = null;
let mapConfigPromise = null;

export async function fetchMapConfig() {
  if (cachedMapConfig) return cachedMapConfig;
  if (!mapConfigPromise) {
    const base = import.meta.env.VITE_API_URL || "";
    mapConfigPromise = fetch(`${base}/api/map/`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load map config");
        return res.json();
      })
      .then((data) => {
        cachedMapConfig = data;
        return data;
      })
      .catch((err) => {
        mapConfigPromise = null;
        throw err;
      });
  }
  return mapConfigPromise;
}
