import { speakDirection } from "./voice";
import { loadBasin, planRoute, reversePlace, searchNearby, searchPlaces } from "./geo";
import { boundsOf, formatDistance, haversine, samePlace, type Place, type RouteStep, type TravelMode } from "./model";
import { useMeridian } from "./store";

let searchToken = 0;
let routeToken = 0;
let basinToken = 0;
let noticeTimer = 0;
let voiceToken = 0;
let player: HTMLAudioElement | null = null;

function pushRecent(place: Place) {
  const recents = [place, ...useMeridian.getState().recents.filter((item) => item.id !== place.id)].slice(0, 8);
  useMeridian.setState({ recents });
}

export function notify(message: string) {
  window.clearTimeout(noticeTimer);
  useMeridian.setState({ notice: message });
  noticeTimer = window.setTimeout(() => {
    if (useMeridian.getState().notice === message) useMeridian.setState({ notice: null });
  }, 4200);
}

function resetGuide() {
  return { guideOn: false, guideIndex: 0 };
}

function activeRoute() {
  const state = useMeridian.getState();
  const routes = state.routesByMode[state.mode] ?? [];
  return routes[state.routeIndex] ?? routes[0] ?? null;
}

function focusStep(step: RouteStep | undefined) {
  if (!step || (!step.lng && !step.lat)) return;
  flyTo({ lng: step.lng, lat: step.lat }, 16.6);
}

function spokenCue(step: RouteStep) {
  const line = step.instruction.replace(/\s+/g, " ").trim();
  if (step.distance > 30) return `${line}. Encore ${formatDistance(step.distance)}.`;
  return line;
}

function speakLocal(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    useMeridian.setState({ voiceStatus: "idle" });
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 1;
  utterance.onend = () => {
    if (useMeridian.getState().voiceStatus === "speaking") useMeridian.setState({ voiceStatus: "idle" });
  };
  useMeridian.setState({ voiceStatus: "speaking" });
  window.speechSynthesis.speak(utterance);
}

export function stopVoice() {
  voiceToken += 1;
  player?.pause();
  player = null;
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  if (useMeridian.getState().voiceStatus !== "idle") useMeridian.setState({ voiceStatus: "idle" });
}

export async function announceCurrent() {
  const state = useMeridian.getState();
  if (!state.voiceOn || !state.guideOn) return;
  const step = activeRoute()?.steps[state.guideIndex];
  if (!step) return;
  const text = spokenCue(step);
  const token = ++voiceToken;
  speakLocal(text);
  try {
    const result = await speakDirection({ data: { text } });
    if (token !== voiceToken || !useMeridian.getState().voiceOn || !result.ok) return;
    window.speechSynthesis?.cancel();
    player?.pause();
    const audio = new Audio(`data:audio/mpeg;base64,${result.audio}`);
    player = audio;
    audio.onended = () => {
      if (player === audio) useMeridian.setState({ voiceStatus: "idle" });
    };
    try {
      await audio.play();
      if (token === voiceToken) useMeridian.setState({ voiceStatus: "speaking" });
    } catch {
      if (token === voiceToken) speakLocal(text);
    }
  } catch {
    /* the phone voice is already saying the turn */
  }
}

export function toggleVoice() {
  const next = !useMeridian.getState().voiceOn;
  useMeridian.setState({ voiceOn: next });
  if (!next) stopVoice();
  else void announceCurrent();
}

export function openGuide() {
  const route = activeRoute();
  if (!route?.steps.length) {
    notify("Pas encore d'étapes à suivre.");
    return;
  }
  useMeridian.setState({ guideOn: true, guideIndex: 0, stepsOpen: true });
  focusStep(route.steps[0]);
  void announceCurrent();
}

export function moveGuide(direction: -1 | 1) {
  const route = activeRoute();
  if (!route?.steps.length) return;
  const index = Math.min(route.steps.length - 1, Math.max(0, useMeridian.getState().guideIndex + direction));
  useMeridian.setState({ guideOn: true, guideIndex: index });
  focusStep(route.steps[index]);
  void announceCurrent();
}

export function showGuideStep(index: number) {
  const route = activeRoute();
  if (!route?.steps.length) return;
  const next = Math.min(route.steps.length - 1, Math.max(0, index));
  useMeridian.setState({ guideOn: true, guideIndex: next, stepsOpen: true });
  focusStep(route.steps[next]);
  void announceCurrent();
}

export function stopGuide() {
  stopVoice();
  useMeridian.setState({ guideOn: false });
}

export function flyTo(place: Pick<Place, "lng" | "lat">, zoom = 15.2) {
  useMeridian.setState({
    camera: { kind: "fly", lng: place.lng, lat: place.lat, zoom, nonce: Date.now() },
  });
}

export function setQuery(query: string) {
  const state = useMeridian.getState();
  useMeridian.setState({
    query,
    panel: query.trim().length >= 2 ? "results" : state.intent ? "results" : state.panel === "results" ? "home" : state.panel,
    searchStatus: query.trim().length >= 2 ? "loading" : "idle",
    activeCategory: null,
  });
}

export async function runSearch(query: string) {
  const token = ++searchToken;
  const q = query.trim();
  if (q.length < 2) return;
  const { viewport } = useMeridian.getState();
  useMeridian.setState({ searchStatus: "loading", panel: "results", resultsLabel: `« ${q} »` });
  try {
    const results = await searchPlaces({ data: { q, lng: viewport.lng, lat: viewport.lat } });
    if (token !== searchToken) return;
    useMeridian.setState({ results, searchStatus: "idle", pois: results });
  } catch {
    if (token !== searchToken) return;
    useMeridian.setState({ results: [], searchStatus: "error", pois: [] });
    notify("La recherche de lieux ne répond pas. Réessayez.");
  }
}

export async function exploreCategory(id: string, q: string, label: string) {
  const token = ++searchToken;
  const { viewport, activeCategory } = useMeridian.getState();
  if (activeCategory === id) {
    useMeridian.setState({ activeCategory: null, pois: [], results: [], panel: "home", query: "" });
    return;
  }
  useMeridian.setState({
    activeCategory: id,
    query: "",
    panel: "results",
    resultsLabel: label,
    searchStatus: "loading",
    intent: null,
  });
  try {
    const results = await searchNearby({ data: { q, lng: viewport.lng, lat: viewport.lat } });
    if (token !== searchToken) return;
    const sorted = [...results].sort(
      (a, b) => haversine(viewport.lng, viewport.lat, a.lng, a.lat) - haversine(viewport.lng, viewport.lat, b.lng, b.lat),
    );
    useMeridian.setState({ results: sorted, pois: sorted, searchStatus: "idle" });
    if (!sorted.length) notify(`Aucun résultat « ${label} » dans ce cadrage.`);
  } catch {
    if (token !== searchToken) return;
    useMeridian.setState({ searchStatus: "error", results: [], pois: [] });
    notify("L'exploration autour de la carte a échoué.");
  }
}

export function choosePlace(place: Place) {
  const state = useMeridian.getState();
  pushRecent(place);
  if (state.intent === "origin") {
    useMeridian.setState({
      origin: place,
      intent: null,
      query: "",
      selected: place,
      panel: state.destination ? "route" : "place",
      results: [],
      ...resetGuide(),
    });
    flyTo(place);
    if (state.destination) void plan();
    if (state.isochroneOn) void refreshBasin();
    return;
  }
  if (state.intent === "stop") {
    if (state.stops.length >= 3) {
      notify("Trois arrêts maximum.");
      return;
    }
    useMeridian.setState({
      stops: [...state.stops, place],
      intent: null,
      query: "",
      panel: "route",
      results: [],
    });
    void plan();
    return;
  }
  useMeridian.setState({
    selected: place,
    destination: null,
    stops: [],
    routesByMode: {},
    routeIndex: 0,
    routeStatus: "idle",
    panel: "place",
    query: "",
    intent: null,
    results: [],
    stepsOpen: false,
    ...resetGuide(),
  });
  flyTo(place);
}

export function openPlace(place: Place) {
  choosePlace(place);
}

export function closeToHome() {
  useMeridian.setState({
    panel: "home",
    intent: null,
    query: "",
    results: [],
    selected: null,
    activeCategory: null,
  });
}

export function arm(intent: "origin" | "destination" | "stop") {
  const label =
    intent === "origin" ? "Nouveau départ" : intent === "stop" ? "Ajouter un arrêt" : "Destination";
  useMeridian.setState({
    intent,
    panel: "results",
    query: "",
    results: [],
    resultsLabel: label,
    searchStatus: "idle",
    focusNonce: Date.now(),
    activeCategory: null,
  });
}

export async function routeTo(place: Place) {
  const state = useMeridian.getState();
  if (samePlace(place, state.origin)) {
    notify("Le départ et l'arrivée sont au même endroit.");
    return;
  }
  useMeridian.setState({
    selected: place,
    destination: place,
    stops: [],
    panel: "route",
    intent: null,
    query: "",
    stepsOpen: false,
    routeIndex: 0,
    ...resetGuide(),
  });
  await plan();
}

export async function plan() {
  const token = ++routeToken;
  const state = useMeridian.getState();
  if (!state.destination) return;
  const points = [state.origin, ...state.stops, state.destination].map((place) => ({
    lng: place.lng,
    lat: place.lat,
  }));
  useMeridian.setState({ routeStatus: "loading", panel: "route", ...resetGuide() });
  const modes: TravelMode[] = ["walking", "cycling", "driving"];
  try {
    const entries = await Promise.all(
      modes.map(async (mode) => {
        try {
          const routes = await planRoute({ data: { points, mode } });
          return [mode, routes] as const;
        } catch {
          return [mode, []] as const;
        }
      }),
    );
    if (token !== routeToken) return;
    const routesByMode = Object.fromEntries(entries) as typeof state.routesByMode;
    const active = routesByMode[useMeridian.getState().mode] ?? [];
    if (!active.length && entries.every((entry) => entry[1].length === 0)) {
      useMeridian.setState({ routeStatus: "error", routesByMode });
      notify("Aucun itinéraire sur le réseau. Le lieu est peut-être hors desserte.");
      return;
    }
    const geometry = active[0]?.geometry.coordinates ?? [];
    const bounds = boundsOf(geometry);
    useMeridian.setState({
      routesByMode,
      routeStatus: active.length ? "idle" : "error",
      routeIndex: 0,
      camera: bounds ? { kind: "fit", bounds, nonce: Date.now() } : state.camera,
    });
    if (!active.length) notify("Pas de tracé pour ce mode. Essayez un autre.");
  } catch {
    if (token !== routeToken) return;
    useMeridian.setState({ routeStatus: "error" });
    notify("Le calcul d'itinéraire a échoué.");
  }
}

export function setMode(mode: TravelMode) {
  const state = useMeridian.getState();
  useMeridian.setState({ mode, routeIndex: 0 });
  const routes = state.routesByMode[mode];
  const bounds = boundsOf(routes?.[0]?.geometry.coordinates ?? []);
  if (bounds) useMeridian.setState({ camera: { kind: "fit", bounds, nonce: Date.now() } });
  if (state.isochroneOn) void refreshBasin();
}

export function setRouteIndex(routeIndex: number) {
  useMeridian.setState({ routeIndex });
}

export function swapEnds() {
  const state = useMeridian.getState();
  if (!state.destination) return;
  useMeridian.setState({
    origin: state.destination,
    destination: state.origin,
    stops: [...state.stops].reverse(),
  });
  void plan();
}

export function removeStop(id: string) {
  useMeridian.setState({ stops: useMeridian.getState().stops.filter((stop) => stop.id !== id) });
  void plan();
}

export function departFrom(place: Place) {
  useMeridian.setState({ origin: place });
  if (useMeridian.getState().destination) void plan();
  if (useMeridian.getState().isochroneOn) void refreshBasin();
  notify(`Départ fixé : ${place.name}`);
}

export function saveFavorite(place: Place) {
  const favorites = useMeridian.getState().favorites;
  if (favorites.some((item) => item.id === place.id)) {
    useMeridian.setState({ favorites: favorites.filter((item) => item.id !== place.id) });
    notify("Retiré des favoris.");
    return;
  }
  useMeridian.setState({ favorites: [place, ...favorites].slice(0, 12) });
  notify("Enregistré dans les favoris.");
}

export function setSlot(slot: "home" | "work", place: Place) {
  if (slot === "home") useMeridian.setState({ home: place });
  else useMeridian.setState({ work: place });
  notify(slot === "home" ? "Maison enregistrée sur cet appareil." : "Travail enregistré sur cet appareil.");
}

export function clearRoute() {
  routeToken += 1;
  useMeridian.setState({
    destination: null,
    stops: [],
    routesByMode: {},
    routeStatus: "idle",
    routeIndex: 0,
    panel: "home",
    stepsOpen: false,
    ...resetGuide(),
  });
}

export async function selectOnMap(lng: number, lat: number) {
  const state = useMeridian.getState();
  if (state.measuring) {
    useMeridian.setState({ measure: [...state.measure, [lng, lat]] });
    return;
  }
  const optimistic: Place = {
    id: `pt:${lat.toFixed(5)}:${lng.toFixed(5)}`,
    name: "Point sur la carte",
    subtitle: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    lng,
    lat,
  };
  useMeridian.setState({
    selected: optimistic,
    panel: "place",
    destination: null,
    routesByMode: {},
    routeStatus: "idle",
    intent: null,
    ...resetGuide(),
  });
  try {
    const place = await reversePlace({ data: { lng, lat } });
    const current = useMeridian.getState().selected;
    if (!current || current.id !== optimistic.id) return;
    if (place) useMeridian.setState({ selected: place });
  } catch {
    /* optimistic pin already shown */
  }
}

export function toggleMeasure() {
  const measuring = !useMeridian.getState().measuring;
  useMeridian.setState({ measuring, panel: measuring ? useMeridian.getState().panel : useMeridian.getState().panel });
  if (measuring) notify("Touchez la carte pour mesurer. Double toucher : zoom.");
}

export function undoMeasure() {
  const measure = useMeridian.getState().measure.slice(0, -1);
  useMeridian.setState({ measure });
}

export function clearMeasure() {
  useMeridian.setState({ measure: [], measuring: false });
}

export async function refreshBasin() {
  const token = ++basinToken;
  const state = useMeridian.getState();
  if (!state.isochroneOn) {
    useMeridian.setState({ isochrone: null, isochroneStatus: "idle" });
    return;
  }
  const anchor = state.origin;
  useMeridian.setState({ isochroneStatus: "loading" });
  try {
    const result = await loadBasin({
      data: { lng: anchor.lng, lat: anchor.lat, mode: state.mode, minutes: state.isochroneMin },
    });
    if (token !== basinToken) return;
    useMeridian.setState({
      isochrone: result.collection,
      isochroneReal: result.real,
      isochroneStatus: "idle",
    });
    if (!result.real) notify("Réseau indisponible : bassin estimé en anneau.");
  } catch {
    if (token !== basinToken) return;
    useMeridian.setState({ isochroneStatus: "error", isochrone: null });
  }
}

export function setIsochrone(on: boolean) {
  useMeridian.setState({ isochroneOn: on });
  void refreshBasin();
}

export function setIsochroneMin(minutes: 10 | 15 | 30) {
  useMeridian.setState({ isochroneMin: minutes, isochroneOn: true });
  void refreshBasin();
}

let watchId: number | null = null;

export function askGps() {
  const state = useMeridian.getState();
  if (state.gps === "live") {
    if (!state.gpsFollow) {
      useMeridian.setState({ gpsFollow: true });
      return;
    }
    stopGps();
    return;
  }
  useMeridian.setState({ gps: "ask" });
}

export function cancelGpsAsk() {
  if (useMeridian.getState().gps === "ask") useMeridian.setState({ gps: "off" });
}

export function allowGps() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    useMeridian.setState({ gps: "denied" });
    notify("Ce navigateur ne propose pas la localisation.");
    return;
  }
  if (watchId != null) navigator.geolocation.clearWatch(watchId);
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lng = pos.coords.longitude;
      const lat = pos.coords.latitude;
      const accuracy = Number.isFinite(pos.coords.accuracy) ? Math.round(pos.coords.accuracy) : null;
      const heading =
        pos.coords.heading != null && Number.isFinite(pos.coords.heading) ? pos.coords.heading : null;
      const state = useMeridian.getState();
      const first = state.gps !== "live";
      const place: Place = {
        id: "user",
        name: "Ma position",
        subtitle: accuracy != null ? `GPS · ±${accuracy} m` : "GPS",
        lng,
        lat,
      };
      useMeridian.setState({
        gps: "live",
        gpsFollow: first ? true : state.gpsFollow,
        user: { lng, lat, accuracy, heading },
        ...(first
          ? {
              origin: place,
              camera: { kind: "fly" as const, lng, lat, zoom: 16, nonce: Date.now() },
            }
          : {}),
      });
      if (first && useMeridian.getState().destination) void plan();
      if (first && useMeridian.getState().isochroneOn) void refreshBasin();
    },
    (err) => {
      if (err.code === err.PERMISSION_DENIED) {
        if (watchId != null) navigator.geolocation.clearWatch(watchId);
        watchId = null;
        useMeridian.setState({ gps: "denied", gpsFollow: false });
        notify("Autorisation refusée. Activez la position dans le navigateur, puis réessayez.");
        return;
      }
      notify("Signal GPS introuvable. Réessayez près d'une fenêtre ou dehors.");
    },
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
  );
}

export function stopGps() {
  if (watchId != null && typeof navigator !== "undefined" && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
  watchId = null;
  useMeridian.setState({ gps: "off", gpsFollow: false });
  notify("Mode GPS arrêté.");
}

export function pauseGpsFollow() {
  if (useMeridian.getState().gpsFollow) useMeridian.setState({ gpsFollow: false });
}

export function locate() {
  askGps();
}

export function useMapCenterAsOrigin() {
  const { viewport } = useMeridian.getState();
  const place: Place = {
    id: `center:${viewport.lat.toFixed(4)}:${viewport.lng.toFixed(4)}`,
    name: "Centre de la carte",
    subtitle: "Cadrage actuel",
    lng: viewport.lng,
    lat: viewport.lat,
  };
  departFrom(place);
}
