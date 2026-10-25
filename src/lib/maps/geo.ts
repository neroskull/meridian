import { createServerFn } from "@tanstack/react-start";
import { fallbackBasin, stepInstruction, type GeoCollection, type RouteOption, type TravelMode } from "./model";

const UA = "Meridian/1.0 (atlas cartographique; +https://grok.com)";

type CacheEntry = { exp: number; data: unknown };
const cache = new Map<string, CacheEntry>();

function remember<T>(key: string, ttlMs: number, data: T) {
  cache.set(key, { exp: Date.now() + ttlMs, data });
  if (cache.size > 180) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  return data;
}

function recall<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (hit.exp < Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return hit.data as T;
}

async function getJson(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "User-Agent": UA,
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Service indisponible (${response.status})`);
  return response.json();
}

function cleanQuery(value: string) {
  return value.replace(/[^\p{L}\p{N}\s,''.-]/gu, "").trim().slice(0, 80);
}

function asNumber(value: unknown, min: number, max: number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error("Coordonnée invalide");
  return n;
}

type NominatimItem = {
  place_id?: number;
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  type?: string;
  address?: Record<string, string>;
};

function toPlace(item: NominatimItem) {
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const address = item.address ?? {};
  const city = address.city || address.town || address.village || address.municipality || address.state || "";
  const road = address.road || address.pedestrian || address.neighbourhood || "";
  const subtitle = [road, address.postcode, city].filter(Boolean).slice(0, 3).join(" · ");
  const display = item.display_name?.split(",").slice(1, 3).join(" · ").trim() ?? "";
  const name = item.name || item.display_name?.split(",")[0]?.trim() || "Lieu";
  return {
    id: item.place_id ? `osm:${item.place_id}` : `${lat.toFixed(5)}:${lng.toFixed(5)}`,
    name,
    subtitle: subtitle || display || item.type || "Lieu",
    lng,
    lat,
  };
}

type Hit = NonNullable<ReturnType<typeof toPlace>>;

async function nominatim(params: Record<string, string>): Promise<Hit[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "fr");
  url.searchParams.set("limit", "8");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const key = url.toString();
  const cached = recall<Hit[]>(key);
  if (cached) return cached;
  const json = (await getJson(url.toString())) as NominatimItem[];
  const places = json.map(toPlace).filter((place): place is Hit => place !== null);
  return remember(key, 120_000, places);
}

export const searchPlaces = createServerFn({ method: "POST" })
  .validator((data: { q: string; lng: number; lat: number }) => {
    const q = cleanQuery(data?.q ?? "");
    if (q.length < 2) throw new Error("Requête trop courte");
    return { q, lng: asNumber(data?.lng, -180, 180), lat: asNumber(data?.lat, -85, 85) };
  })
  .handler(async ({ data }) => {
    const dLng = 0.55;
    const dLat = 0.35;
    return nominatim({
      q: data.q,
      viewbox: `${data.lng - dLng},${data.lat + dLat},${data.lng + dLng},${data.lat - dLat}`,
      bounded: "0",
    });
  });

export const searchNearby = createServerFn({ method: "POST" })
  .validator((data: { q: string; lng: number; lat: number }) => {
    const q = cleanQuery(data?.q ?? "");
    if (q.length < 2) throw new Error("Catégorie invalide");
    return { q, lng: asNumber(data?.lng, -180, 180), lat: asNumber(data?.lat, -85, 85) };
  })
  .handler(async ({ data }) => {
    const dLng = 0.06;
    const dLat = 0.04;
    return nominatim({
      q: data.q,
      viewbox: `${data.lng - dLng},${data.lat + dLat},${data.lng + dLng},${data.lat - dLat}`,
      bounded: "1",
    });
  });

export const reversePlace = createServerFn({ method: "POST" })
  .validator((data: { lng: number; lat: number }) => ({
    lng: asNumber(data?.lng, -180, 180),
    lat: asNumber(data?.lat, -85, 85),
  }))
  .handler(async ({ data }) => {
    const key = `rev:${data.lat.toFixed(4)}:${data.lng.toFixed(4)}`;
    const cached = recall<{ id: string; name: string; subtitle: string; lng: number; lat: number } | null>(key);
    if (cached !== undefined) return cached;
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", String(data.lat));
    url.searchParams.set("lon", String(data.lng));
    url.searchParams.set("zoom", "18");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("accept-language", "fr");
    try {
      const json = (await getJson(url.toString())) as NominatimItem;
      const place = toPlace({ ...json, lat: String(data.lat), lon: String(data.lng) });
      return remember(key, 120_000, place);
    } catch {
      return remember(key, 20_000, null);
    }
  });

type OsrmRoute = {
  distance?: number;
  duration?: number;
  geometry?: { type?: string; coordinates?: [number, number][] };
  legs?: {
    steps?: {
      distance?: number;
      duration?: number;
      name?: string;
      maneuver?: { type?: string; modifier?: string; exit?: number; location?: [number, number] };
    }[];
  }[];
};

export const planRoute = createServerFn({ method: "POST" })
  .validator((data: { points: { lng: number; lat: number }[]; mode: TravelMode }) => {
    const mode = data?.mode;
    if (mode !== "driving" && mode !== "cycling" && mode !== "walking") throw new Error("Mode invalide");
    const points = Array.isArray(data?.points) ? data.points.slice(0, 6) : [];
    if (points.length < 2) throw new Error("Deux points minimum");
    return {
      mode,
      points: points.map((point) => ({
        lng: asNumber(point?.lng, -180, 180),
        lat: asNumber(point?.lat, -85, 85),
      })),
    };
  })
  .handler(async ({ data }) => {
    const profile = data.mode === "cycling" ? "cycling" : data.mode === "walking" ? "walking" : "driving";
    const coordPath = data.points.map((point) => `${point.lng},${point.lat}`).join(";");
    const key = `${profile}:${coordPath}`;
    const cached = recall<RouteOption[]>(key);
    if (cached) return cached;
    const url =
      `https://router.project-osrm.org/route/v1/${profile}/${coordPath}` +
      "?overview=full&geometries=geojson&steps=true&alternatives=true";
    const json = (await getJson(url)) as { code?: string; routes?: OsrmRoute[] };
    if (json.code !== "Ok" || !json.routes?.length) return remember(key, 30_000, [] as RouteOption[]);
    const routes: RouteOption[] = json.routes.slice(0, 3).flatMap((route, index) => {
      const coordinates = route.geometry?.coordinates ?? [];
      if (coordinates.length < 2) return [];
      const steps = (route.legs ?? []).flatMap((leg) =>
        (leg.steps ?? []).map((step) => ({
          instruction: stepInstruction(step),
          distance: step.distance ?? 0,
          duration: step.duration ?? 0,
          lng: step.maneuver?.location?.[0] ?? 0,
          lat: step.maneuver?.location?.[1] ?? 0,
        })),
      );
      return [
        {
          id: `${profile}-${index}`,
          distance: route.distance ?? 0,
          duration: route.duration ?? 0,
          geometry: { type: "LineString" as const, coordinates },
          steps,
        },
      ];
    });
    return remember(key, 60_000, routes);
  });

export const loadBasin = createServerFn({ method: "POST" })
  .validator((data: { lng: number; lat: number; mode: TravelMode; minutes: number }) => {
    const mode = data?.mode;
    if (mode !== "driving" && mode !== "cycling" && mode !== "walking") throw new Error("Mode invalide");
    const minutes = data?.minutes === 10 || data?.minutes === 30 ? data.minutes : 15;
    return {
      mode,
      minutes,
      lng: asNumber(data?.lng, -180, 180),
      lat: asNumber(data?.lat, -85, 85),
    };
  })
  .handler(async ({ data }) => {
    const costing = data.mode === "driving" ? "auto" : data.mode === "cycling" ? "bicycle" : "pedestrian";
    const key = `iso:${costing}:${data.minutes}:${data.lat.toFixed(3)}:${data.lng.toFixed(3)}`;
    const cached = recall<{ collection: GeoCollection; real: boolean }>(key);
    if (cached) return cached;
    const half = Math.max(5, Math.round(data.minutes / 2));
    try {
      const json = (await getJson("https://valhalla1.openstreetmap.de/isochrone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations: [{ lat: data.lat, lon: data.lng }],
          costing,
          contours: [{ time: half }, { time: data.minutes }],
          polygons: true,
          denoise: 0.35,
          generalize: 40,
        }),
      })) as GeoCollection;
      const features = (json.features ?? []).filter(
        (feature) => feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon",
      );
      if (!features.length) throw new Error("Bassin vide");
      return remember(key, 180_000, {
        real: true,
        collection: { type: "FeatureCollection" as const, features },
      });
    } catch {
      return remember(key, 30_000, {
        real: false,
        collection: fallbackBasin(data.lng, data.lat, data.mode, data.minutes),
      });
    }
  });
