export type AtlasId = "jour" | "clair" | "encre" | "nuit";

export type TravelMode = "driving" | "cycling" | "walking";

export type Panel = "home" | "results" | "place" | "route" | "atlas";

export type PickIntent = "destination" | "origin" | "stop" | null;

export type Place = {
  id: string;
  name: string;
  subtitle: string;
  lng: number;
  lat: number;
};

export type RouteStep = {
  instruction: string;
  distance: number;
  duration: number;
  lng: number;
  lat: number;
};

export type RouteOption = {
  id: string;
  distance: number;
  duration: number;
  geometry: { type: "LineString"; coordinates: [number, number][] };
  steps: RouteStep[];
};

export type LngLat = [number, number];

export type GeoGeometry =
  | { type: "Polygon"; coordinates: LngLat[][] }
  | { type: "MultiPolygon"; coordinates: LngLat[][][] }
  | { type: "LineString"; coordinates: LngLat[] };

export type GeoFeature = {
  type: "Feature";
  properties: Record<string, string | number | boolean | null>;
  geometry: GeoGeometry;
};

export type GeoCollection = {
  type: "FeatureCollection";
  features: GeoFeature[];
};

export const ATLASES: { id: AtlasId; label: string; detail: string; url: string }[] = [
  {
    id: "jour",
    label: "Jour",
    detail: "Rues et parcs",
    url: "https://tiles.openfreemap.org/styles/liberty",
  },
  {
    id: "clair",
    label: "Clair",
    detail: "Fond pâle",
    url: "https://tiles.openfreemap.org/styles/bright",
  },
  {
    id: "encre",
    label: "Encre",
    detail: "Papier",
    url: "https://tiles.openfreemap.org/styles/positron",
  },
  {
    id: "nuit",
    label: "Nuit",
    detail: "Contraste bas",
    url: "https://tiles.openfreemap.org/styles/dark",
  },
];

export const CATEGORIES: { id: string; label: string; q: string }[] = [
  { id: "cafe", label: "Cafés", q: "café" },
  { id: "table", label: "Tables", q: "restaurant" },
  { id: "culture", label: "Culture", q: "musée" },
  { id: "nature", label: "Parcs", q: "parc" },
  { id: "sante", label: "Santé", q: "pharmacie" },
  { id: "rail", label: "Gares", q: "gare" },
];

export const PARIS_ORIGIN: Place = {
  id: "cite",
  name: "Île de la Cité",
  subtitle: "Paris · point de départ",
  lng: 2.347,
  lat: 48.853,
};

export const REPERES: Place[] = [
  { id: "louvre", name: "Louvre", subtitle: "Paris · Musée", lng: 2.3376, lat: 48.8606 },
  { id: "eiffel", name: "Tour Eiffel", subtitle: "Paris · Champ-de-Mars", lng: 2.2945, lat: 48.8584 },
  { id: "orsay", name: "Musée d'Orsay", subtitle: "Paris · Musée", lng: 2.3266, lat: 48.86 },
  { id: "sacre", name: "Sacré-Cœur", subtitle: "Paris · Montmartre", lng: 2.3431, lat: 48.8867 },
  { id: "luxembourg", name: "Luxembourg", subtitle: "Paris · Jardin", lng: 2.3371, lat: 48.8462 },
  { id: "vosges", name: "Place des Vosges", subtitle: "Paris · Le Marais", lng: 2.3655, lat: 48.8556 },
  { id: "lyon", name: "Bellecour", subtitle: "Lyon", lng: 4.832, lat: 45.7578 },
  { id: "marseille", name: "Vieux-Port", subtitle: "Marseille", lng: 5.3698, lat: 43.2951 },
  { id: "nice", name: "Promenade des Anglais", subtitle: "Nice", lng: 7.265, lat: 43.695 },
  { id: "bordeaux", name: "Place de la Bourse", subtitle: "Bordeaux", lng: -0.57, lat: 44.8412 },
  { id: "lille", name: "Grand-Place", subtitle: "Lille", lng: 3.063, lat: 50.6366 },
  { id: "strasbourg", name: "Cathédrale", subtitle: "Strasbourg", lng: 7.7511, lat: 48.5818 },
  { id: "london", name: "Trafalgar Square", subtitle: "Londres", lng: -0.1281, lat: 51.508 },
  { id: "bruxelles", name: "Grand-Place", subtitle: "Bruxelles", lng: 4.3525, lat: 50.8467 },
  { id: "amsterdam", name: "Dam", subtitle: "Amsterdam", lng: 4.8926, lat: 52.3731 },
  { id: "barcelona", name: "Sagrada Família", subtitle: "Barcelone", lng: 2.1744, lat: 41.4036 },
  { id: "roma", name: "Colisée", subtitle: "Rome", lng: 12.4922, lat: 41.8902 },
  { id: "berlin", name: "Porte de Brandebourg", subtitle: "Berlin", lng: 13.3777, lat: 52.5163 },
  { id: "nyc", name: "Central Park", subtitle: "New York", lng: -73.9654, lat: 40.7829 },
  { id: "tokyo", name: "Shibuya", subtitle: "Tokyo", lng: 139.7006, lat: 35.6595 },
];

export function nearbyMarks(lng: number, lat: number) {
  const ranked = REPERES.map((place) => ({
    place,
    distance: haversine(lng, lat, place.lng, place.lat),
  })).sort((a, b) => a.distance - b.distance);
  const close = ranked.filter((item) => item.distance < 140_000).slice(0, 8);
  return (close.length >= 3 ? close : ranked.slice(0, 6)).map((item) => item.place);
}

export const MODES: { id: TravelMode; label: string }[] = [
  { id: "walking", label: "Marche" },
  { id: "cycling", label: "Vélo" },
  { id: "driving", label: "Voiture" },
];

export function atlasUrl(id: AtlasId) {
  return ATLASES.find((a) => a.id === id)?.url ?? ATLASES[0].url;
}

export function lineColors(atlas: AtlasId) {
  if (atlas === "nuit") {
    return { line: "#f2f4f6", casing: "#0e1114", alt: "#8eb4c4", poi: "#d7e2ea" };
  }
  return { line: "#172028", casing: "#f7f4ee", alt: "#5d7c8a", poi: "#172028" };
}

export function haversine(aLng: number, aLat: number, bLng: number, bLat: number) {
  const R = 6371000;
  const r = Math.PI / 180;
  const dLat = (bLat - aLat) * r;
  const dLng = (bLng - aLng) * r;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function pathLength(points: [number, number][]) {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversine(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1]);
  }
  return total;
}

export function formatDistance(meters: number) {
  if (!Number.isFinite(meters)) return "—";
  if (meters < 950) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  const km = meters / 1000;
  const digits = km < 10 ? 1 : 0;
  return `${km.toFixed(digits).replace(".", ",")} km`;
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds)) return "—";
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m.toString().padStart(2, "0")}` : `${h} h`;
}

export function samePlace(a: Place | null, b: Place | null) {
  if (!a || !b) return false;
  return haversine(a.lng, a.lat, b.lng, b.lat) < 35;
}

export function nearParis(lng: number, lat: number) {
  return haversine(lng, lat, 2.3522, 48.8566) < 80000;
}

export function clockNow() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function dateFromClock(clock: string, base = new Date()) {
  const [h, m] = clock.split(":").map((part) => Number(part));
  const d = new Date(base);
  if (Number.isFinite(h) && Number.isFinite(m)) d.setHours(h, m, 0, 0);
  return d;
}

/** Urban congestion curve. Transparent estimate, not live traffic. */
export function trafficAt(date: Date) {
  const day = date.getDay();
  const hour = date.getHours() + date.getMinutes() / 60;
  const weekend = day === 0 || day === 6;
  if (weekend) {
    if (hour >= 11 && hour <= 19) {
      return { factor: 1.12, title: "Animé", detail: "Week-end, circulation plus lente · +12 %" };
    }
    return { factor: 1.02, title: "Calme", detail: "Week-end hors affluence · +2 %" };
  }
  if (hour >= 7.5 && hour < 9.5) {
    return { factor: 1.35, title: "Dense", detail: "Pointe du matin · +35 %" };
  }
  if (hour >= 16.5 && hour < 19.25) {
    return { factor: 1.42, title: "Dense", detail: "Pointe du soir · +42 %" };
  }
  if (hour >= 12 && hour < 14) {
    return { factor: 1.16, title: "Chargé", detail: "Pause méridienne · +16 %" };
  }
  if (hour >= 22 || hour < 6) {
    return { factor: 0.92, title: "Dégagé", detail: "Nuit, réseau libre · −8 %" };
  }
  return { factor: 1.08, title: "Fluide", detail: "Hors pointe · +8 %" };
}

export function adjustedDrive(seconds: number, factor: number) {
  return seconds * factor;
}

export function footprint(mode: TravelMode, meters: number) {
  const km = meters / 1000;
  if (mode === "driving") {
    const grams = km * 192;
    const value = grams >= 1000 ? `${(grams / 1000).toFixed(1).replace(".", ",")} kg` : `${Math.round(grams)} g`;
    return { label: "CO₂ estimé", value };
  }
  const kcal = mode === "cycling" ? km * 28 : km * 52;
  return { label: "Dépense", value: `${Math.max(1, Math.round(kcal))} kcal` };
}

export function pace(mode: TravelMode, meters: number) {
  const speed = mode === "driving" ? 7.8 : mode === "cycling" ? 4.4 : 1.35;
  return meters / speed;
}

export function circleFeature(lng: number, lat: number, radiusM: number, minutes: number): GeoFeature {
  const coords: LngLat[] = [];
  const R = 6378137;
  const steps = 72;
  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * Math.PI * 2;
    const dx = radiusM * Math.cos(bearing);
    const dy = radiusM * Math.sin(bearing);
    const dLat = (dy / R) * (180 / Math.PI);
    const dLng = (dx / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
    coords.push([lng + dLng, lat + dLat]);
  }
  return {
    type: "Feature",
    properties: { minutes, fallback: true },
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

export function fallbackBasin(lng: number, lat: number, mode: TravelMode, minutes: number): GeoCollection {
  const speed = mode === "driving" ? 8.2 : mode === "cycling" ? 4.4 : 1.35;
  const features = [minutes, Math.max(5, Math.round(minutes / 2))].map((min) =>
    circleFeature(lng, lat, speed * min * 60, min),
  );
  return { type: "FeatureCollection", features };
}

function sunHours(lat: number, lng: number, day: number, rise: boolean) {
  const rad = Math.PI / 180;
  const t = day + ((rise ? 6 : 18) - lng / 15) / 24;
  const M = 0.9856 * t - 3.289;
  let L = M + 1.916 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 282.634;
  L = (L + 360) % 360;
  let RA = Math.atan(0.91764 * Math.tan(L * rad)) / rad;
  RA = (RA + 360) % 360;
  const Lq = Math.floor(L / 90) * 90;
  const RAq = Math.floor(RA / 90) * 90;
  RA = (RA + (Lq - RAq)) / 15;
  const sinDec = 0.39782 * Math.sin(L * rad);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH =
    (Math.cos(90.833 * rad) - sinDec * Math.sin(lat * rad)) / (cosDec * Math.cos(lat * rad));
  if (cosH > 1 || cosH < -1) return null;
  const H = (rise ? 360 - Math.acos(cosH) / rad : Math.acos(cosH) / rad) / 15;
  let UT = H + RA - 0.06571 * t - 6.622 - lng / 15;
  UT = ((UT % 24) + 24) % 24;
  return UT;
}

export function sunLine(lat: number, lng: number, now = new Date()) {
  const yearStart = Date.UTC(now.getUTCFullYear(), 0, 0);
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const day = Math.floor((today - yearStart) / 86400000);
  const riseH = sunHours(lat, lng, day, true);
  const setH = sunHours(lat, lng, day, false);
  if (riseH == null || setH == null) return "Jour continu ou nuit polaire à cette date";
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const set = new Date(base + setH * 3600000);
  const rise = new Date(base + riseH * 3600000);
  const golden = new Date(set.getTime() - 50 * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const upcoming = now < set && now > rise ? `Dorée ${fmt(golden)} · coucher ${fmt(set)}` : `Lever ${fmt(rise)} · coucher ${fmt(set)}`;
  return upcoming;
}

export function boundsOf(coords: [number, number][]) {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const [lng, lat] of coords) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  if (!Number.isFinite(west)) return null;
  return [
    [west, south],
    [east, north],
  ] as [[number, number], [number, number]];
}

const MANEUVER: Record<string, string> = {
  depart: "Partez",
  arrive: "Vous êtes arrivé",
  turn: "Tournez",
  "new name": "Continuez",
  continue: "Continuez",
  merge: "Insérez-vous",
  "on ramp": "Prenez la bretelle",
  "off ramp": "Sortez",
  fork: "À la bifurcation, prenez",
  "end of road": "Au bout de la voie, prenez",
  roundabout: "Au rond-point",
  rotary: "Au giratoire",
  "roundabout turn": "Au rond-point",
  notification: "Continuez",
  "exit roundabout": "Sortez du rond-point",
  "exit rotary": "Sortez du giratoire",
};

const MODIFIER: Record<string, string> = {
  left: "à gauche",
  right: "à droite",
  "slight left": "légèrement à gauche",
  "slight right": "légèrement à droite",
  "sharp left": "franchement à gauche",
  "sharp right": "franchement à droite",
  straight: "tout droit",
  uturn: "et faites demi-tour",
};

export function stepInstruction(step: {
  name?: string;
  maneuver?: { type?: string; modifier?: string; exit?: number };
}) {
  const type = step.maneuver?.type ?? "continue";
  const modifier = step.maneuver?.modifier ?? "";
  const street = step.name ? ` · ${step.name}` : "";
  if (type === "arrive") return "Vous êtes arrivé";
  if (type === "depart") return `Partez${street}`;
  if (type === "roundabout" || type === "rotary") {
    const exit = step.maneuver?.exit;
    const sortie = exit ? `, sortie ${exit}` : "";
    return `Au rond-point${sortie}${street}`;
  }
  const verb = MANEUVER[type] ?? "Continuez";
  const dir = MODIFIER[modifier] ?? "";
  return `${verb}${dir ? ` ${dir}` : ""}${street}`;
}
