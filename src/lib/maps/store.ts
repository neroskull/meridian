import { create } from "zustand";
import {
  PARIS_ORIGIN,
  type AtlasId,
  type GeoCollection,
  type Panel,
  type PickIntent,
  type Place,
  type RouteOption,
  type TravelMode,
} from "./model";

export type Camera =
  | { kind: "fly"; lng: number; lat: number; zoom: number; nonce: number }
  | { kind: "fit"; bounds: [[number, number], [number, number]]; nonce: number };

type Status = "idle" | "loading" | "error";

export type MeridianState = {
  atlas: AtlasId;
  globe: boolean;
  pitch3d: boolean;
  bearing: number;
  mode: TravelMode;
  departAt: string;
  origin: Place;
  destination: Place | null;
  stops: Place[];
  selected: Place | null;
  pois: Place[];
  results: Place[];
  resultsLabel: string;
  query: string;
  searchStatus: Status;
  panel: Panel;
  intent: PickIntent;
  recents: Place[];
  favorites: Place[];
  home: Place | null;
  work: Place | null;
  routesByMode: Partial<Record<TravelMode, RouteOption[]>>;
  routeIndex: number;
  routeStatus: Status;
  measuring: boolean;
  measure: [number, number][];
  isochroneOn: boolean;
  isochroneMin: 10 | 15 | 30;
  isochrone: GeoCollection | null;
  isochroneReal: boolean;
  isochroneStatus: Status;
  viewport: { lng: number; lat: number; zoom: number };
  user: { lng: number; lat: number; accuracy: number | null; heading: number | null } | null;
  gps: "off" | "ask" | "live" | "denied";
  gpsFollow: boolean;
  camera: Camera | null;
  focusNonce: number;
  northNonce: number;
  notice: string | null;
  stepsOpen: boolean;
  guideOn: boolean;
  guideIndex: number;
  voiceOn: boolean;
  voiceStatus: "idle" | "loading" | "speaking";
  activeCategory: string | null;
};

const KEY = "meridian.v1";

function isPlace(value: unknown): value is Place {
  if (!value || typeof value !== "object") return false;
  const place = value as Place;
  return (
    typeof place.id === "string" &&
    typeof place.name === "string" &&
    typeof place.subtitle === "string" &&
    typeof place.lng === "number" &&
    typeof place.lat === "number"
  );
}

function loadPersisted() {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const data = JSON.parse(raw) as Partial<MeridianState>;
    const atlas: AtlasId =
      data.atlas === "clair" || data.atlas === "encre" || data.atlas === "nuit" || data.atlas === "jour"
        ? data.atlas
        : "jour";
    const mode: TravelMode =
      data.mode === "cycling" || data.mode === "walking" || data.mode === "driving" ? data.mode : "walking";
    return {
      atlas,
      globe: Boolean(data.globe),
      mode,
      favorites: Array.isArray(data.favorites) ? data.favorites.filter(isPlace).slice(0, 12) : [],
      recents: Array.isArray(data.recents) ? data.recents.filter(isPlace).slice(0, 8) : [],
      home: isPlace(data.home) ? data.home : null,
      work: isPlace(data.work) ? data.work : null,
    };
  } catch {
    return {};
  }
}

export const useMeridian = create<MeridianState>(() => ({
  atlas: "jour",
  globe: false,
  pitch3d: false,
  bearing: 0,
  mode: "walking",
  departAt: "12:00",
  origin: PARIS_ORIGIN,
  destination: null,
  stops: [],
  selected: null,
  pois: [],
  results: [],
  resultsLabel: "Résultats",
  query: "",
  searchStatus: "idle",
  panel: "home",
  intent: null,
  recents: [],
  favorites: [],
  home: null,
  work: null,
  routesByMode: {},
  routeIndex: 0,
  routeStatus: "idle",
  measuring: false,
  measure: [],
  isochroneOn: false,
  isochroneMin: 15,
  isochrone: null,
  isochroneReal: false,
  isochroneStatus: "idle",
  viewport: { lng: PARIS_ORIGIN.lng, lat: PARIS_ORIGIN.lat, zoom: 13 },
  user: null,
  gps: "off",
  gpsFollow: false,
  camera: null,
  focusNonce: 0,
  northNonce: 0,
  notice: null,
  stepsOpen: false,
  guideOn: false,
  guideIndex: 0,
  voiceOn: true,
  voiceStatus: "idle",
  activeCategory: null,
}));

useMeridian.subscribe((state, prev) => {
  if (typeof window === "undefined") return;
  if (
    state.atlas === prev.atlas &&
    state.globe === prev.globe &&
    state.mode === prev.mode &&
    state.favorites === prev.favorites &&
    state.recents === prev.recents &&
    state.home === prev.home &&
    state.work === prev.work
  ) {
    return;
  }
  const slice = {
    atlas: state.atlas,
    globe: state.globe,
    mode: state.mode,
    favorites: state.favorites,
    recents: state.recents,
    home: state.home,
    work: state.work,
  };
  localStorage.setItem(KEY, JSON.stringify(slice));
});

export function hydrateMeridian() {
  const data = loadPersisted();
  if (!data || Object.keys(data).length === 0) return;
  useMeridian.setState(data);
}
