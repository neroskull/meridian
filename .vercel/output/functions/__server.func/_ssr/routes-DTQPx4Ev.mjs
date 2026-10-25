import { i as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { S as trafficAt, _ as pace, a as adjustedDrive, c as clockNow, d as footprint, f as formatDistance, g as nearbyMarks, h as lineColors, i as PARIS_ORIGIN, l as dateFromClock, m as haversine, n as CATEGORIES, o as atlasUrl, p as formatDuration, r as MODES, s as boundsOf, t as ATLASES, v as pathLength, x as sunLine, y as samePlace } from "./model-B5Gm8WMb.mjs";
import { a as Plus, c as House, d as ChevronLeft, f as Briefcase, i as Ruler, l as Compass, m as ArrowLeftRight, o as LocateFixed, p as Bookmark, r as Search, s as Layers, t as X, u as ChevronRight } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DTQPx4Ev.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEY = "meridian.v1";
function isPlace(value) {
	if (!value || typeof value !== "object") return false;
	const place = value;
	return typeof place.id === "string" && typeof place.name === "string" && typeof place.subtitle === "string" && typeof place.lng === "number" && typeof place.lat === "number";
}
function loadPersisted() {
	if (typeof window === "undefined") return {};
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return {};
		const data = JSON.parse(raw);
		const atlas = data.atlas === "clair" || data.atlas === "encre" || data.atlas === "nuit" || data.atlas === "jour" ? data.atlas : "jour";
		const mode = data.mode === "cycling" || data.mode === "walking" || data.mode === "driving" ? data.mode : "walking";
		return {
			atlas,
			globe: Boolean(data.globe),
			mode,
			favorites: Array.isArray(data.favorites) ? data.favorites.filter(isPlace).slice(0, 12) : [],
			recents: Array.isArray(data.recents) ? data.recents.filter(isPlace).slice(0, 8) : [],
			home: isPlace(data.home) ? data.home : null,
			work: isPlace(data.work) ? data.work : null
		};
	} catch {
		return {};
	}
}
var useMeridian = create(() => ({
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
	viewport: {
		lng: PARIS_ORIGIN.lng,
		lat: PARIS_ORIGIN.lat,
		zoom: 13
	},
	user: null,
	camera: null,
	focusNonce: 0,
	northNonce: 0,
	notice: null,
	stepsOpen: false,
	guideOn: false,
	guideIndex: 0,
	activeCategory: null
}));
useMeridian.subscribe((state, prev) => {
	if (typeof window === "undefined") return;
	if (state.atlas === prev.atlas && state.globe === prev.globe && state.mode === prev.mode && state.favorites === prev.favorites && state.recents === prev.recents && state.home === prev.home && state.work === prev.work) return;
	const slice = {
		atlas: state.atlas,
		globe: state.globe,
		mode: state.mode,
		favorites: state.favorites,
		recents: state.recents,
		home: state.home,
		work: state.work
	};
	localStorage.setItem(KEY, JSON.stringify(slice));
});
function hydrateMeridian() {
	const data = loadPersisted();
	if (!data || Object.keys(data).length === 0) return;
	useMeridian.setState(data);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function cleanQuery(value) {
	return value.replace(/[^\p{L}\p{N}\s,''.-]/gu, "").trim().slice(0, 80);
}
function asNumber(value, min, max) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n) || n < min || n > max) throw new Error("Coordonnée invalide");
	return n;
}
var searchPlaces = createServerFn({ method: "POST" }).validator((data) => {
	const q = cleanQuery(data?.q ?? "");
	if (q.length < 2) throw new Error("Requête trop courte");
	return {
		q,
		lng: asNumber(data?.lng, -180, 180),
		lat: asNumber(data?.lat, -85, 85)
	};
}).handler(createSsrRpc("97fa10f34c713124b1f4bf433ba27525e66e6e94ce71722fc124a9bebce103c6"));
var searchNearby = createServerFn({ method: "POST" }).validator((data) => {
	const q = cleanQuery(data?.q ?? "");
	if (q.length < 2) throw new Error("Catégorie invalide");
	return {
		q,
		lng: asNumber(data?.lng, -180, 180),
		lat: asNumber(data?.lat, -85, 85)
	};
}).handler(createSsrRpc("5d073880408dd28cd57b454214edd61d267fc08ff45fcddcd84c8eda331e9b91"));
var reversePlace = createServerFn({ method: "POST" }).validator((data) => ({
	lng: asNumber(data?.lng, -180, 180),
	lat: asNumber(data?.lat, -85, 85)
})).handler(createSsrRpc("ff42c7fe19a21e98cec967617442418d1b129e84136f053b3aa87a8530a0c633"));
var planRoute = createServerFn({ method: "POST" }).validator((data) => {
	const mode = data?.mode;
	if (mode !== "driving" && mode !== "cycling" && mode !== "walking") throw new Error("Mode invalide");
	const points = Array.isArray(data?.points) ? data.points.slice(0, 6) : [];
	if (points.length < 2) throw new Error("Deux points minimum");
	return {
		mode,
		points: points.map((point) => ({
			lng: asNumber(point?.lng, -180, 180),
			lat: asNumber(point?.lat, -85, 85)
		}))
	};
}).handler(createSsrRpc("0e81ec9bd0c00be9814691ba7b9147e3c2251c4faa24def287cda73d7f33e2e7"));
var loadBasin = createServerFn({ method: "POST" }).validator((data) => {
	const mode = data?.mode;
	if (mode !== "driving" && mode !== "cycling" && mode !== "walking") throw new Error("Mode invalide");
	return {
		mode,
		minutes: data?.minutes === 10 || data?.minutes === 30 ? data.minutes : 15,
		lng: asNumber(data?.lng, -180, 180),
		lat: asNumber(data?.lat, -85, 85)
	};
}).handler(createSsrRpc("2ce57ba480d565415b7f258848ec2fcbfc7961343beef2b3cf122a0aa2b665a2"));
var searchToken = 0;
var routeToken = 0;
var basinToken = 0;
var noticeTimer = 0;
function pushRecent(place) {
	const recents = [place, ...useMeridian.getState().recents.filter((item) => item.id !== place.id)].slice(0, 8);
	useMeridian.setState({ recents });
}
function notify(message) {
	window.clearTimeout(noticeTimer);
	useMeridian.setState({ notice: message });
	noticeTimer = window.setTimeout(() => {
		if (useMeridian.getState().notice === message) useMeridian.setState({ notice: null });
	}, 4200);
}
function resetGuide() {
	return {
		guideOn: false,
		guideIndex: 0
	};
}
function activeRoute() {
	const state = useMeridian.getState();
	const routes = state.routesByMode[state.mode] ?? [];
	return routes[state.routeIndex] ?? routes[0] ?? null;
}
function focusStep(step) {
	if (!step || !step.lng && !step.lat) return;
	flyTo({
		lng: step.lng,
		lat: step.lat
	}, 16.6);
}
function openGuide() {
	const route = activeRoute();
	if (!route?.steps.length) {
		notify("Pas encore d'étapes à suivre.");
		return;
	}
	useMeridian.setState({
		guideOn: true,
		guideIndex: 0,
		stepsOpen: true
	});
	focusStep(route.steps[0]);
}
function moveGuide(direction) {
	const route = activeRoute();
	if (!route?.steps.length) return;
	const index = Math.min(route.steps.length - 1, Math.max(0, useMeridian.getState().guideIndex + direction));
	useMeridian.setState({
		guideOn: true,
		guideIndex: index
	});
	focusStep(route.steps[index]);
}
function showGuideStep(index) {
	const route = activeRoute();
	if (!route?.steps.length) return;
	const next = Math.min(route.steps.length - 1, Math.max(0, index));
	useMeridian.setState({
		guideOn: true,
		guideIndex: next,
		stepsOpen: true
	});
	focusStep(route.steps[next]);
}
function stopGuide() {
	useMeridian.setState({ guideOn: false });
}
function flyTo(place, zoom = 15.2) {
	useMeridian.setState({ camera: {
		kind: "fly",
		lng: place.lng,
		lat: place.lat,
		zoom,
		nonce: Date.now()
	} });
}
function setQuery(query) {
	const state = useMeridian.getState();
	useMeridian.setState({
		query,
		panel: query.trim().length >= 2 ? "results" : state.intent ? "results" : state.panel === "results" ? "home" : state.panel,
		searchStatus: query.trim().length >= 2 ? "loading" : "idle",
		activeCategory: null
	});
}
async function runSearch(query) {
	const token = ++searchToken;
	const q = query.trim();
	if (q.length < 2) return;
	const { viewport } = useMeridian.getState();
	useMeridian.setState({
		searchStatus: "loading",
		panel: "results",
		resultsLabel: `« ${q} »`
	});
	try {
		const results = await searchPlaces({ data: {
			q,
			lng: viewport.lng,
			lat: viewport.lat
		} });
		if (token !== searchToken) return;
		useMeridian.setState({
			results,
			searchStatus: "idle",
			pois: results
		});
	} catch {
		if (token !== searchToken) return;
		useMeridian.setState({
			results: [],
			searchStatus: "error",
			pois: []
		});
		notify("La recherche de lieux ne répond pas. Réessayez.");
	}
}
async function exploreCategory(id, q, label) {
	const token = ++searchToken;
	const { viewport, activeCategory } = useMeridian.getState();
	if (activeCategory === id) {
		useMeridian.setState({
			activeCategory: null,
			pois: [],
			results: [],
			panel: "home",
			query: ""
		});
		return;
	}
	useMeridian.setState({
		activeCategory: id,
		query: "",
		panel: "results",
		resultsLabel: label,
		searchStatus: "loading",
		intent: null
	});
	try {
		const results = await searchNearby({ data: {
			q,
			lng: viewport.lng,
			lat: viewport.lat
		} });
		if (token !== searchToken) return;
		const sorted = [...results].sort((a, b) => haversine(viewport.lng, viewport.lat, a.lng, a.lat) - haversine(viewport.lng, viewport.lat, b.lng, b.lat));
		useMeridian.setState({
			results: sorted,
			pois: sorted,
			searchStatus: "idle"
		});
		if (!sorted.length) notify(`Aucun résultat « ${label} » dans ce cadrage.`);
	} catch {
		if (token !== searchToken) return;
		useMeridian.setState({
			searchStatus: "error",
			results: [],
			pois: []
		});
		notify("L'exploration autour de la carte a échoué.");
	}
}
function choosePlace(place) {
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
			...resetGuide()
		});
		flyTo(place);
		if (state.destination) plan();
		if (state.isochroneOn) refreshBasin();
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
			results: []
		});
		plan();
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
		...resetGuide()
	});
	flyTo(place);
}
function closeToHome() {
	useMeridian.setState({
		panel: "home",
		intent: null,
		query: "",
		results: [],
		selected: null,
		activeCategory: null
	});
}
function arm(intent) {
	const label = intent === "origin" ? "Nouveau départ" : intent === "stop" ? "Ajouter un arrêt" : "Destination";
	useMeridian.setState({
		intent,
		panel: "results",
		query: "",
		results: [],
		resultsLabel: label,
		searchStatus: "idle",
		focusNonce: Date.now(),
		activeCategory: null
	});
}
async function routeTo(place) {
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
		...resetGuide()
	});
	await plan();
}
async function plan() {
	const token = ++routeToken;
	const state = useMeridian.getState();
	if (!state.destination) return;
	const points = [
		state.origin,
		...state.stops,
		state.destination
	].map((place) => ({
		lng: place.lng,
		lat: place.lat
	}));
	useMeridian.setState({
		routeStatus: "loading",
		panel: "route",
		...resetGuide()
	});
	const modes = [
		"walking",
		"cycling",
		"driving"
	];
	try {
		const entries = await Promise.all(modes.map(async (mode) => {
			try {
				return [mode, await planRoute({ data: {
					points,
					mode
				} })];
			} catch {
				return [mode, []];
			}
		}));
		if (token !== routeToken) return;
		const routesByMode = Object.fromEntries(entries);
		const active = routesByMode[useMeridian.getState().mode] ?? [];
		if (!active.length && entries.every((entry) => entry[1].length === 0)) {
			useMeridian.setState({
				routeStatus: "error",
				routesByMode
			});
			notify("Aucun itinéraire sur le réseau. Le lieu est peut-être hors desserte.");
			return;
		}
		const geometry = active[0]?.geometry.coordinates ?? [];
		const bounds = boundsOf(geometry);
		useMeridian.setState({
			routesByMode,
			routeStatus: active.length ? "idle" : "error",
			routeIndex: 0,
			camera: bounds ? {
				kind: "fit",
				bounds,
				nonce: Date.now()
			} : state.camera
		});
		if (!active.length) notify("Pas de tracé pour ce mode. Essayez un autre.");
	} catch {
		if (token !== routeToken) return;
		useMeridian.setState({ routeStatus: "error" });
		notify("Le calcul d'itinéraire a échoué.");
	}
}
function setMode(mode) {
	const state = useMeridian.getState();
	useMeridian.setState({
		mode,
		routeIndex: 0
	});
	const routes = state.routesByMode[mode];
	const bounds = boundsOf(routes?.[0]?.geometry.coordinates ?? []);
	if (bounds) useMeridian.setState({ camera: {
		kind: "fit",
		bounds,
		nonce: Date.now()
	} });
	if (state.isochroneOn) refreshBasin();
}
function setRouteIndex(routeIndex) {
	useMeridian.setState({ routeIndex });
}
function swapEnds() {
	const state = useMeridian.getState();
	if (!state.destination) return;
	useMeridian.setState({
		origin: state.destination,
		destination: state.origin,
		stops: [...state.stops].reverse()
	});
	plan();
}
function removeStop(id) {
	useMeridian.setState({ stops: useMeridian.getState().stops.filter((stop) => stop.id !== id) });
	plan();
}
function departFrom(place) {
	useMeridian.setState({ origin: place });
	if (useMeridian.getState().destination) plan();
	if (useMeridian.getState().isochroneOn) refreshBasin();
	notify(`Départ fixé : ${place.name}`);
}
function saveFavorite(place) {
	const favorites = useMeridian.getState().favorites;
	if (favorites.some((item) => item.id === place.id)) {
		useMeridian.setState({ favorites: favorites.filter((item) => item.id !== place.id) });
		notify("Retiré des favoris.");
		return;
	}
	useMeridian.setState({ favorites: [place, ...favorites].slice(0, 12) });
	notify("Enregistré dans les favoris.");
}
function setSlot(slot, place) {
	if (slot === "home") useMeridian.setState({ home: place });
	else useMeridian.setState({ work: place });
	notify(slot === "home" ? "Maison enregistrée sur cet appareil." : "Travail enregistré sur cet appareil.");
}
function clearRoute() {
	routeToken += 1;
	useMeridian.setState({
		destination: null,
		stops: [],
		routesByMode: {},
		routeStatus: "idle",
		routeIndex: 0,
		panel: "home",
		stepsOpen: false,
		...resetGuide()
	});
}
async function selectOnMap(lng, lat) {
	const state = useMeridian.getState();
	if (state.measuring) {
		useMeridian.setState({ measure: [...state.measure, [lng, lat]] });
		return;
	}
	const optimistic = {
		id: `pt:${lat.toFixed(5)}:${lng.toFixed(5)}`,
		name: "Point sur la carte",
		subtitle: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
		lng,
		lat
	};
	useMeridian.setState({
		selected: optimistic,
		panel: "place",
		destination: null,
		routesByMode: {},
		routeStatus: "idle",
		intent: null,
		...resetGuide()
	});
	try {
		const place = await reversePlace({ data: {
			lng,
			lat
		} });
		const current = useMeridian.getState().selected;
		if (!current || current.id !== optimistic.id) return;
		if (place) useMeridian.setState({ selected: place });
	} catch {}
}
function undoMeasure() {
	const measure = useMeridian.getState().measure.slice(0, -1);
	useMeridian.setState({ measure });
}
function clearMeasure() {
	useMeridian.setState({
		measure: [],
		measuring: false
	});
}
async function refreshBasin() {
	const token = ++basinToken;
	const state = useMeridian.getState();
	if (!state.isochroneOn) {
		useMeridian.setState({
			isochrone: null,
			isochroneStatus: "idle"
		});
		return;
	}
	const anchor = state.origin;
	useMeridian.setState({ isochroneStatus: "loading" });
	try {
		const result = await loadBasin({ data: {
			lng: anchor.lng,
			lat: anchor.lat,
			mode: state.mode,
			minutes: state.isochroneMin
		} });
		if (token !== basinToken) return;
		useMeridian.setState({
			isochrone: result.collection,
			isochroneReal: result.real,
			isochroneStatus: "idle"
		});
		if (!result.real) notify("Réseau indisponible : bassin estimé en anneau.");
	} catch {
		if (token !== basinToken) return;
		useMeridian.setState({
			isochroneStatus: "error",
			isochrone: null
		});
	}
}
function setIsochrone(on) {
	useMeridian.setState({ isochroneOn: on });
	refreshBasin();
}
function setIsochroneMin(minutes) {
	useMeridian.setState({
		isochroneMin: minutes,
		isochroneOn: true
	});
	refreshBasin();
}
function locate() {
	if (!navigator.geolocation) {
		notify("La géolocalisation n'est pas disponible ici.");
		return;
	}
	navigator.geolocation.getCurrentPosition((pos) => {
		const lng = pos.coords.longitude;
		const lat = pos.coords.latitude;
		const place = {
			id: "user",
			name: "Ma position",
			subtitle: "Position actuelle",
			lng,
			lat
		};
		useMeridian.setState({
			user: {
				lng,
				lat
			},
			origin: place,
			viewport: {
				lng,
				lat,
				zoom: 15
			},
			camera: {
				kind: "fly",
				lng,
				lat,
				zoom: 15,
				nonce: Date.now()
			}
		});
		if (useMeridian.getState().destination) plan();
		if (useMeridian.getState().isochroneOn) refreshBasin();
		notify("Position utilisée comme départ.");
	}, () => notify("Localisation refusée. L'atlas reste sur le cadrage actuel."), {
		enableHighAccuracy: true,
		timeout: 8e3,
		maximumAge: 2e4
	});
}
function useMapCenterAsOrigin() {
	const { viewport } = useMeridian.getState();
	departFrom({
		id: `center:${viewport.lat.toFixed(4)}:${viewport.lng.toFixed(4)}`,
		name: "Centre de la carte",
		subtitle: "Cadrage actuel",
		lng: viewport.lng,
		lat: viewport.lat
	});
}
function cx(...parts) {
	return parts.filter(Boolean).join(" ");
}
function useWide() {
	const [wide, setWide] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const query = window.matchMedia("(min-width: 900px)");
		const apply = () => setWide(query.matches);
		apply();
		query.addEventListener("change", apply);
		return () => query.removeEventListener("change", apply);
	}, []);
	return wide;
}
function Controls() {
	const wide = useWide();
	const bearing = useMeridian((s) => s.bearing);
	const measuring = useMeridian((s) => s.measuring);
	const measure = useMeridian((s) => s.measure);
	const panel = useMeridian((s) => s.panel);
	const meters = pathLength(measure);
	const guideOn = useMeridian((s) => s.guideOn);
	const guideIndex = useMeridian((s) => s.guideIndex);
	const mode = useMeridian((s) => s.mode);
	const routesByMode = useMeridian((s) => s.routesByMode);
	const routeIndex = useMeridian((s) => s.routeIndex);
	const route = (routesByMode[mode] ?? [])[routeIndex] ?? (routesByMode[mode] ?? [])[0];
	const step = guideOn ? route?.steps[guideIndex] : void 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cx("map-tools absolute z-20 flex flex-col gap-2", wide && "map-tools-wide"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
					label: "Ma position",
					onClick: locate,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LocateFixed, {
						className: "size-5",
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
					label: "Recaler au nord",
					onClick: () => useMeridian.setState({ northNonce: Date.now() }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, {
						className: "size-5",
						strokeWidth: 1.75,
						style: { transform: `rotate(${-bearing}deg)` }
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
					label: measuring ? "Quitter la mesure" : "Mesurer",
					pressed: measuring,
					onClick: () => useMeridian.setState({ measuring: !measuring }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ruler, {
						className: "size-5",
						strokeWidth: 1.75
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconButton, {
					label: "Fonds et bassins",
					pressed: panel === "atlas",
					onClick: () => useMeridian.setState({ panel: panel === "atlas" ? "home" : "atlas" }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, {
						className: "size-5",
						strokeWidth: 1.75
					})
				})
			]
		}),
		step && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cx("guide-card shadow-panel absolute z-30 rounded-2xl border border-line bg-surface px-3 py-3", wide && "guide-card-wide"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-subtle tabular-nums",
						children: [
							"Étape ",
							guideIndex + 1,
							" / ",
							route?.steps.length ?? 0
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Quitter le guidage",
						onClick: stopGuide,
						className: "grid size-8 place-items-center text-muted",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							className: "size-4",
							strokeWidth: 1.75
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-fg",
					children: step.instruction
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-muted tabular-nums",
					children: formatDistance(step.distance)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => moveGuide(-1),
						className: "inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-line text-sm text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), "Avant"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => moveGuide(1),
						className: "inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-accent text-sm text-accent-fg",
						children: ["Après", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
					})]
				})
			]
		}),
		(measuring || measure.length > 1) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "measure-card absolute z-20 rounded-2xl border border-line bg-surface px-4 py-3 shadow-panel",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-subtle",
					children: measuring ? "Touchez la carte" : "Mesure"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-lg font-medium tabular-nums text-fg",
					children: measure.length > 1 ? formatDistance(meters) : "0 m"
				}),
				measure.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted tabular-nums",
					children: [
						formatDuration(pace("walking", meters)),
						" à pied · ",
						formatDuration(pace("cycling", meters)),
						" à vélo"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: undoMeasure,
						className: "h-9 rounded-lg border border-line px-3 text-xs text-fg",
						children: "Annuler"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: clearMeasure,
						className: "h-9 rounded-lg border border-line px-3 text-xs text-fg",
						children: "Effacer"
					})]
				})
			]
		})
	] });
}
function IconButton({ label, onClick, pressed, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		"aria-pressed": pressed,
		onClick,
		className: cx("icon-btn grid size-11 place-items-center rounded-xl border shadow-panel", pressed ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-fg"),
		children
	});
}
function SearchField() {
	const query = useMeridian((s) => s.query);
	const intent = useMeridian((s) => s.intent);
	const focusNonce = useMeridian((s) => s.focusNonce);
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const q = query.trim();
		if (q.length < 2) return;
		const timer = window.setTimeout(() => void runSearch(q), 360);
		return () => window.clearTimeout(timer);
	}, [query]);
	(0, import_react.useEffect)(() => {
		if (focusNonce) ref.current?.focus();
	}, [focusNonce]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "flex h-12 items-center gap-2 rounded-2xl border border-line bg-bg px-3 focus-within:border-ink",
		onSubmit: (event) => {
			event.preventDefault();
			const q = query.trim();
			if (q.length >= 2) runSearch(q);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
				className: "size-4 shrink-0 text-subtle",
				strokeWidth: 1.75,
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref,
				value: query,
				onChange: (event) => setQuery(event.target.value),
				placeholder: intent === "origin" ? "Nouveau départ" : intent === "stop" ? "Ajouter un arrêt" : "Lieu, adresse, ville",
				"aria-label": "Rechercher un lieu",
				autoComplete: "off",
				enterKeyHint: "search",
				className: "w-full bg-transparent text-sm text-fg outline-none placeholder:text-subtle",
				"data-testid": "search"
			}),
			query && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "grid size-8 place-items-center text-muted",
				onClick: () => setQuery(""),
				"aria-label": "Effacer",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
					className: "size-4",
					strokeWidth: 1.75
				})
			})
		]
	});
}
function Mark() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 32 32",
		className: "size-8 text-fg",
		"aria-hidden": true,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "16",
				cy: "16",
				r: "11",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M7 19c3.2-7 14.8-7 18 0",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "16",
				cy: "13.5",
				r: "1.7",
				fill: "currentColor"
			})
		]
	});
}
function Dock() {
	const wide = useWide();
	const panel = useMeridian((s) => s.panel);
	const notice = useMeridian((s) => s.notice);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: cx("dock shadow-panel absolute z-20 flex flex-col overflow-hidden border border-line bg-surface", wide ? "bottom-3 left-3 top-3 w-96 rounded-3xl" : cx("right-3 bottom-3 left-3 rounded-3xl", panel === "home" ? "sheet-home" : "sheet-open")),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 px-4 pt-4 pb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl leading-none tracking-tight text-fg",
						children: "Meridian"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-subtle",
						children: "Atlas vivant"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-4 pt-3 pb-3",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchField, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "scroll-y min-h-0 flex-1 overflow-y-auto px-4 pb-4",
				children: [
					notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-3 rounded-lg bg-bg px-3 py-2 text-sm text-fg",
						role: "status",
						children: notice
					}),
					panel === "home" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HomePanel, {}),
					panel === "results" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultsPanel, {}),
					panel === "place" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlacePanel, {}),
					panel === "route" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoutePanel, {}),
					panel === "atlas" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AtlasPanel, {})
				]
			})
		]
	});
}
function Section({ title, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "mt-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-xs font-medium tracking-widest text-subtle uppercase",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2",
			children
		})]
	});
}
function HomePanel() {
	const viewport = useMeridian((s) => s.viewport);
	const favorites = useMeridian((s) => s.favorites);
	const recents = useMeridian((s) => s.recents);
	const home = useMeridian((s) => s.home);
	const work = useMeridian((s) => s.work);
	const departAt = useMeridian((s) => s.departAt);
	const activeCategory = useMeridian((s) => s.activeCategory);
	const traffic = trafficAt(dateFromClock(departAt));
	const marks = nearbyMarks(viewport.lng, viewport.lat);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-xl bg-bg px-3 py-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: "Fluidité estimée"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium text-fg",
					children: traffic.title
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-xs text-subtle",
				children: [traffic.detail, ". Ce n'est pas un trafic live."]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "scroll-x mt-3 flex gap-2 overflow-x-auto",
			children: CATEGORIES.map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				"aria-pressed": activeCategory === category.id,
				onClick: () => void exploreCategory(category.id, category.q, category.label),
				className: cx("h-10 shrink-0 rounded-lg border px-3 text-sm", activeCategory === category.id ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-fg"),
				children: category.label
			}, category.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 grid grid-cols-2 gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotButton, {
				label: "Maison",
				place: home,
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, {
					className: "size-4",
					strokeWidth: 1.75
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotButton, {
				label: "Travail",
				place: work,
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, {
					className: "size-4",
					strokeWidth: 1.75
				})
			})]
		}),
		marks.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
			title: "Repères proches",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "scroll-x -mx-1 flex gap-2 overflow-x-auto px-1 pb-1",
				children: marks.map((place) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => choosePlace(place),
					className: "w-36 shrink-0 rounded-xl border border-line px-3 py-3 text-left",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block truncate text-sm font-medium text-fg",
						children: place.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 block truncate text-xs text-subtle",
						children: place.subtitle
					})]
				}, place.id))
			})
		}),
		favorites.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
			title: "Favoris",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-line",
				children: favorites.map((place) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaceRow, {
					place,
					meta: place.subtitle,
					onClick: () => choosePlace(place)
				}) }, place.id))
			})
		}),
		recents.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
			title: "Récents",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "divide-y divide-line",
				children: recents.map((place) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaceRow, {
					place,
					meta: place.subtitle,
					onClick: () => choosePlace(place)
				}) }, place.id))
			})
		})
	] });
}
function SlotButton({ label, place, icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => {
			if (place) routeTo(place);
			else notify(`Ouvrez un lieu, puis définissez « ${label} ».`);
		},
		className: "flex h-14 items-center gap-2 rounded-xl border border-line px-3 text-left",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: icon
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block text-xs text-subtle",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "block truncate text-sm text-fg",
				children: place ? place.name : "À définir"
			})]
		})]
	});
}
function PlaceRow({ place, meta, index, onClick }) {
	const origin = useMeridian((s) => s.origin);
	const distance = formatDistance(haversine(origin.lng, origin.lat, place.lng, place.lat));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: "flex w-full items-center gap-3 py-3 text-left",
		"data-testid": "result",
		children: [
			index != null && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-6 font-mono text-xs text-subtle",
				children: String(index).padStart(2, "0")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-sm font-medium text-fg",
					children: place.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-xs text-subtle",
					children: meta
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "shrink-0 text-xs text-muted tabular-nums",
				children: distance
			})
		]
	});
}
function ResultsPanel() {
	const results = useMeridian((s) => s.results);
	const label = useMeridian((s) => s.resultsLabel);
	const status = useMeridian((s) => s.searchStatus);
	const query = useMeridian((s) => s.query);
	const activeCategory = useMeridian((s) => s.activeCategory);
	const intent = useMeridian((s) => s.intent);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-2 flex items-center justify-between gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: closeToHome,
				className: "inline-flex items-center gap-1 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), "Atlas"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "truncate text-xs text-subtle",
				children: label
			})]
		}),
		status === "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-6 text-sm text-muted",
			children: "Recherche…"
		}),
		status !== "loading" && results.length === 0 && (activeCategory || query.trim().length >= 2) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-6 text-sm text-muted",
			children: "Aucun lieu dans ce cadrage."
		}),
		status !== "loading" && results.length === 0 && !activeCategory && query.trim().length < 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "py-6 text-sm text-muted",
			children: intent ? "Saisissez le lieu, puis choisissez-le dans la liste." : "Saisissez au moins deux lettres."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "divide-y divide-line",
			children: results.map((place) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaceRow, {
				place,
				meta: place.subtitle,
				onClick: () => choosePlace(place)
			}) }, place.id))
		})
	] });
}
function PlacePanel() {
	const place = useMeridian((s) => s.selected);
	const origin = useMeridian((s) => s.origin);
	const favorites = useMeridian((s) => s.favorites);
	if (!place) return null;
	const saved = favorites.some((item) => item.id === place.id);
	const distance = formatDistance(haversine(origin.lng, origin.lat, place.lng, place.lat));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: closeToHome,
			className: "inline-flex items-center gap-1 text-sm text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), "Atlas"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display mt-3 text-3xl leading-tight tracking-tight text-fg",
			children: place.name
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-muted",
			children: place.subtitle
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-sm text-fg tabular-nums",
			children: [distance, " du départ"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-xs tracking-widest text-subtle uppercase",
			children: "Lumière · votre heure"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-sm text-fg",
			children: sunLine(place.lat, place.lng)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			"data-testid": "go",
			onClick: () => void routeTo(place),
			className: "mt-4 h-12 w-full rounded-xl bg-accent text-sm font-medium text-accent-fg",
			children: "Itinéraire"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-2 grid grid-cols-3 gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
					onClick: () => setSlot("home", place),
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, { className: "size-4" }),
					label: "Maison"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
					onClick: () => setSlot("work", place),
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Briefcase, { className: "size-4" }),
					label: "Travail"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mini, {
					onClick: () => saveFavorite(place),
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, {
						className: "size-4",
						fill: saved ? "currentColor" : "none"
					}),
					label: saved ? "Sauvé" : "Favori"
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => departFrom(place),
			className: "mt-2 h-11 w-full rounded-lg border border-line text-sm text-fg",
			children: "Partir d'ici"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-xs text-subtle tabular-nums",
			children: [
				place.lat.toFixed(5),
				", ",
				place.lng.toFixed(5)
			]
		})
	] });
}
function Mini({ onClick, icon, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: "flex h-16 flex-col items-center justify-center gap-1 rounded-lg border border-line text-xs text-muted",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-fg",
			children: icon
		}), label]
	});
}
function RoutePanel() {
	const origin = useMeridian((s) => s.origin);
	const destination = useMeridian((s) => s.destination);
	const stops = useMeridian((s) => s.stops);
	const mode = useMeridian((s) => s.mode);
	const routesByMode = useMeridian((s) => s.routesByMode);
	const routeIndex = useMeridian((s) => s.routeIndex);
	const routeStatus = useMeridian((s) => s.routeStatus);
	const departAt = useMeridian((s) => s.departAt);
	const stepsOpen = useMeridian((s) => s.stepsOpen);
	const guideOn = useMeridian((s) => s.guideOn);
	const guideIndex = useMeridian((s) => s.guideIndex);
	const traffic = trafficAt(dateFromClock(departAt));
	const routes = routesByMode[mode] ?? [];
	const route = routes[routeIndex] ?? routes[0];
	const shown = route ? mode === "driving" ? adjustedDrive(route.duration, traffic.factor) : route.duration : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: clearRoute,
				className: "inline-flex items-center gap-1 text-sm text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), "Fermer"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: swapEnds,
				className: "inline-flex items-center gap-1 text-sm text-fg",
				"aria-label": "Inverser départ et arrivée",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeftRight, { className: "size-4" }), "Inverser"]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => arm("origin"),
			className: "flex w-full items-center gap-3 py-2 text-left",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-ink" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs text-subtle",
					children: "Départ"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-sm text-fg",
					children: origin.name
				})]
			})]
		}),
		stops.map((stop, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3 py-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full border border-line" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0 flex-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "block text-xs text-subtle",
						children: ["Arrêt ", index + 1]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block truncate text-sm text-fg",
						children: stop.name
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Retirer l'arrêt",
					onClick: () => removeStop(stop.id),
					className: "text-subtle",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
				})
			]
		}, stop.id)),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => arm("destination"),
			className: "flex w-full items-center gap-3 py-2 text-left",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-fg" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-xs text-subtle",
					children: "Arrivée"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-sm text-fg",
					children: destination?.name ?? "Choisir"
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => arm("stop"),
			className: "mt-1 inline-flex items-center gap-1 text-sm text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), "Ajouter un arrêt"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-4 grid grid-cols-3 gap-2",
			role: "tablist",
			"aria-label": "Mode",
			children: MODES.map((item) => {
				const option = routesByMode[item.id]?.[0];
				const duration = option ? formatDuration(item.id === "driving" ? adjustedDrive(option.duration, traffic.factor) : option.duration) : routeStatus === "loading" ? "…" : "—";
				const active = mode === item.id;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					role: "tab",
					"aria-selected": active,
					onClick: () => setMode(item.id),
					className: cx("rounded-xl border px-2 py-2 text-left", active ? "border-accent bg-accent text-accent-fg" : "border-line text-fg"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs",
						children: item.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 block text-sm font-medium tabular-nums",
						children: duration
					})]
				}, item.id);
			})
		}),
		routeStatus === "loading" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm text-muted",
			children: "Tracé des trois modes…"
		}),
		routeStatus === "error" && !route && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-4 text-sm text-muted",
			children: "Pas de tracé pour cette combinaison. Changez de mode ou de points."
		}),
		route && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-4xl leading-none tabular-nums text-fg",
					children: formatDuration(shown)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-sm text-muted tabular-nums",
					children: [
						formatDistance(route.distance),
						" · ",
						footprint(mode, route.distance).label,
						" ",
						footprint(mode, route.distance).value
					]
				}),
				mode === "driving" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-xs text-subtle tabular-nums",
					children: [
						"Réseau libre ",
						formatDuration(route.duration),
						" · retenu ",
						formatDuration(shown),
						" (",
						traffic.title.toLowerCase(),
						")"
					]
				}),
				routes.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex flex-col gap-2",
					children: routes.map((option, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setRouteIndex(index),
						className: cx("flex items-center justify-between rounded-lg border px-3 py-2 text-sm", index === routeIndex ? "border-ink text-fg" : "border-line text-muted"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: index === 0 ? "Plus rapide" : `Variante ${index + 1}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: formatDuration(mode === "driving" ? adjustedDrive(option.duration, traffic.factor) : option.duration)
						})]
					}, option.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "mt-4 flex items-center justify-between gap-3 text-sm text-muted",
					children: ["Partir à", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "time",
						value: departAt,
						onChange: (event) => useMeridian.setState({ departAt: event.target.value }),
						className: "h-10 rounded-lg border border-line bg-bg px-2 text-fg"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-xs text-subtle",
					children: traffic.detail
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-4 h-11 w-full rounded-xl bg-accent text-sm font-medium text-accent-fg",
					onClick: () => guideOn ? stopGuide() : openGuide(),
					children: guideOn ? "Quitter le guidage" : "Suivre étape par étape"
				}),
				guideOn && route.steps[guideIndex] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-10 flex-1 rounded-lg border border-line text-sm text-fg",
						onClick: () => moveGuide(-1),
						children: "Précédent"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-10 flex-1 rounded-lg border border-line text-sm text-fg",
						onClick: () => moveGuide(1),
						children: "Suivant"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "mt-4 text-sm font-medium text-fg",
					onClick: () => useMeridian.setState({ stepsOpen: !stepsOpen }),
					children: stepsOpen ? "Masquer la feuille de route" : "Feuille de route"
				}),
				stepsOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-2 divide-y divide-line",
					children: route.steps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => showGuideStep(index),
						className: cx("flex w-full items-baseline justify-between gap-3 py-2 text-left", guideOn && index === guideIndex ? "text-fg" : "text-muted"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cx("text-sm", guideOn && index === guideIndex && "font-medium text-fg"),
							children: step.instruction
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0 text-xs text-subtle tabular-nums",
							children: formatDistance(step.distance)
						})]
					}) }, `${step.instruction}-${index}`))
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: useMapCenterAsOrigin,
			className: "mt-4 text-xs text-subtle",
			children: "Utiliser le centre de la carte comme départ"
		})
	] });
}
function AtlasPanel() {
	const atlas = useMeridian((s) => s.atlas);
	const globe = useMeridian((s) => s.globe);
	const pitch3d = useMeridian((s) => s.pitch3d);
	const isochroneOn = useMeridian((s) => s.isochroneOn);
	const isochroneMin = useMeridian((s) => s.isochroneMin);
	const isochroneReal = useMeridian((s) => s.isochroneReal);
	const isochroneStatus = useMeridian((s) => s.isochroneStatus);
	const measuring = useMeridian((s) => s.measuring);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: closeToHome,
			className: "inline-flex items-center gap-1 text-sm text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), "Atlas"]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-3 text-sm font-medium text-fg",
			children: "Fonds"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 grid grid-cols-2 gap-2",
			children: ATLASES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => useMeridian.setState({ atlas: item.id }),
				className: cx("rounded-xl border p-3 text-left", atlas === item.id ? "border-accent bg-bg" : "border-line"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cx("mb-3 block h-8 rounded-md", `swatch-${item.id}`) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-sm text-fg",
						children: item.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "block text-xs text-subtle",
						children: item.detail
					})
				]
			}, item.id))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-col gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					on: globe,
					label: "Globe",
					detail: "Courbure à petite échelle",
					onClick: () => useMeridian.setState({ globe: !globe })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					on: pitch3d,
					label: "Inclinaison",
					detail: "Vue oblique des rues",
					onClick: () => useMeridian.setState({ pitch3d: !pitch3d })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
					on: measuring,
					label: "Mesure",
					detail: "Touchez la carte pour tracer",
					onClick: () => useMeridian.setState({ measuring: !measuring })
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-5 text-sm font-medium text-fg",
			children: "Bassins de temps"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs text-subtle",
			children: "Zone atteignable depuis le départ, sur le réseau quand le service répond."
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2 flex gap-2",
			children: [
				10,
				15,
				30
			].map((minutes) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setIsochroneMin(minutes),
				className: cx("h-10 flex-1 rounded-lg border text-sm tabular-nums", isochroneOn && isochroneMin === minutes ? "border-accent bg-accent text-accent-fg" : "border-line text-fg"),
				children: [minutes, " min"]
			}, minutes))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => setIsochrone(!isochroneOn),
			className: "mt-2 h-10 w-full rounded-lg border border-line text-sm text-fg",
			children: isochroneStatus === "loading" ? "Calcul…" : isochroneOn ? "Masquer le bassin" : "Afficher le bassin"
		}),
		isochroneOn && isochroneStatus === "idle" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-xs text-subtle",
			children: isochroneReal ? "Calculé sur le réseau routier ou piéton." : "Anneau estimé : le service de bassins n'a pas répondu."
		})
	] });
}
function Toggle({ on, label, detail, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		"aria-pressed": on,
		className: "flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-3 text-left",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-sm text-fg",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "block text-xs text-subtle",
			children: detail
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cx("h-6 w-11 rounded-full p-0.5", on ? "bg-accent" : "bg-line"),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cx("block size-5 rounded-full bg-bg transition-transform", on && "translate-x-5") })
		})]
	});
}
var maplibre_gl_worker_default = "/assets/maplibre-gl-worker-BrB25tGK.mjs";
var EMPTY = {
	type: "FeatureCollection",
	features: []
};
function pad() {
	return window.matchMedia("(min-width: 900px)").matches ? {
		top: 72,
		bottom: 72,
		left: 440,
		right: 88
	} : {
		top: 28,
		bottom: 300,
		left: 20,
		right: 64
	};
}
function markerEl(kind) {
	const el = document.createElement("div");
	el.className = `pin pin-${kind}`;
	el.addEventListener("pointerdown", (event) => event.stopPropagation());
	el.addEventListener("click", (event) => event.stopPropagation());
	return el;
}
function MapView() {
	const wrapRef = (0, import_react.useRef)(null);
	const mapRef = (0, import_react.useRef)(null);
	const markersRef = (0, import_react.useRef)([]);
	const mlRef = (0, import_react.useRef)(null);
	const styleRef = (0, import_react.useRef)("");
	const [ready, setReady] = (0, import_react.useState)(false);
	const [failed, setFailed] = (0, import_react.useState)(false);
	const atlas = useMeridian((s) => s.atlas);
	const globe = useMeridian((s) => s.globe);
	const pitch3d = useMeridian((s) => s.pitch3d);
	const camera = useMeridian((s) => s.camera);
	const northNonce = useMeridian((s) => s.northNonce);
	const overlayKey = useMeridian((s) => [
		s.atlas,
		s.mode,
		s.routeIndex,
		s.origin.id,
		s.origin.lng,
		s.origin.lat,
		s.destination?.id ?? "",
		s.stops.map((stop) => stop.id).join(","),
		s.selected?.id ?? "",
		s.user ? "u" : "",
		s.measuring ? "m" : "",
		s.measure.map((p) => p.join(":")).join("|"),
		s.pois.map((p) => p.id).join(","),
		s.isochrone ? s.isochrone.features.length : 0,
		s.isochroneOn ? "on" : "off",
		s.routesByMode[s.mode]?.[s.routeIndex]?.id ?? "",
		s.routesByMode.walking?.[0]?.distance ?? 0,
		s.routesByMode.cycling?.[0]?.distance ?? 0,
		s.routesByMode.driving?.[0]?.distance ?? 0,
		s.guideOn ? `g${s.guideIndex}` : ""
	].join("~"));
	(0, import_react.useEffect)(() => {
		if (!wrapRef.current) return;
		let cancelled = false;
		let map = null;
		const initial = atlasUrl(useMeridian.getState().atlas);
		styleRef.current = initial;
		let observer = null;
		import("../_libs/maplibre-gl.mjs").then((n) => n.t).then((ml) => {
			if (cancelled || !wrapRef.current) return;
			mlRef.current = ml;
			ml.setWorkerUrl(maplibre_gl_worker_default);
			try {
				map = new ml.Map({
					container: wrapRef.current,
					style: initial,
					center: [PARIS_ORIGIN.lng, PARIS_ORIGIN.lat],
					zoom: 12.7,
					attributionControl: false,
					maxPitch: 68,
					fadeDuration: 0
				});
			} catch {
				setFailed(true);
				return;
			}
			if (cancelled) {
				map.remove();
				return;
			}
			map.addControl(new ml.AttributionControl({ compact: true }), "top-left");
			mapRef.current = map;
			const live = map;
			live.on("load", () => {
				setReady(true);
				live.resize();
			});
			live.on("error", () => {});
			live.on("rotate", () => useMeridian.setState({ bearing: live.getBearing() }));
			live.on("moveend", () => {
				const center = live.getCenter();
				useMeridian.setState({
					viewport: {
						lng: center.lng,
						lat: center.lat,
						zoom: live.getZoom()
					},
					bearing: live.getBearing()
				});
			});
			live.on("click", (event) => {
				if (!useMeridian.getState().measuring && live.getLayer("poi")) {
					const id = live.queryRenderedFeatures(event.point, { layers: ["poi"] })[0]?.properties?.id;
					if (typeof id === "string") {
						const place = useMeridian.getState().pois.find((item) => item.id === id);
						if (place) {
							choosePlace(place);
							return;
						}
					}
				}
				selectOnMap(event.lngLat.lng, event.lngLat.lat);
			});
			live.on("mousemove", (event) => {
				const measuring = useMeridian.getState().measuring;
				const over = !measuring && live.getLayer("poi") ? live.queryRenderedFeatures(event.point, { layers: ["poi"] }).length > 0 : false;
				live.getCanvas().style.cursor = measuring ? "crosshair" : over ? "pointer" : "";
			});
			observer = new ResizeObserver(() => live.resize());
			observer.observe(wrapRef.current);
		});
		return () => {
			cancelled = true;
			observer?.disconnect();
			markersRef.current.forEach((marker) => marker.remove());
			map?.remove();
			mapRef.current = null;
			setReady(false);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready) return;
		const url = atlasUrl(atlas);
		if (styleRef.current === url) return;
		styleRef.current = url;
		map.setStyle(url);
	}, [atlas, ready]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready) return;
		try {
			map.setProjection({ type: globe ? "globe" : "mercator" });
		} catch {}
	}, [globe, ready]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready) return;
		map.easeTo({
			pitch: pitch3d ? 58 : 0,
			duration: 450
		});
	}, [pitch3d, ready]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready || !camera) return;
		if (camera.kind === "fly") {
			map.flyTo({
				center: [camera.lng, camera.lat],
				zoom: camera.zoom,
				padding: pad(),
				essential: true,
				duration: 900
			});
			return;
		}
		map.fitBounds(camera.bounds, {
			padding: pad(),
			duration: 800,
			maxZoom: 16
		});
	}, [camera, ready]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready || !northNonce) return;
		map.easeTo({
			bearing: 0,
			duration: 400
		});
	}, [northNonce, ready]);
	(0, import_react.useEffect)(() => {
		const map = mapRef.current;
		if (!map || !ready) return;
		const sync = () => {
			if (!map.isStyleLoaded()) return;
			const state = useMeridian.getState();
			const colors = lineColors(state.atlas);
			if (state.measuring) map.doubleClickZoom.disable();
			else map.doubleClickZoom.enable();
			const routes = state.routesByMode[state.mode] ?? [];
			const selected = routes[state.routeIndex] ?? routes[0];
			const alts = routes.filter((route) => route !== selected);
			put(map, "iso", state.isochroneOn && state.isochrone ? state.isochrone : EMPTY);
			put(map, "alt", {
				type: "FeatureCollection",
				features: alts.map((route) => ({
					type: "Feature",
					properties: {},
					geometry: route.geometry
				}))
			});
			put(map, "route", selected ? {
				type: "Feature",
				properties: {},
				geometry: selected.geometry
			} : EMPTY);
			put(map, "measure", state.measure.length ? {
				type: "Feature",
				properties: {},
				geometry: {
					type: "LineString",
					coordinates: state.measure
				}
			} : EMPTY);
			put(map, "poi", {
				type: "FeatureCollection",
				features: state.pois.map((place) => ({
					type: "Feature",
					properties: { id: place.id },
					geometry: {
						type: "Point",
						coordinates: [place.lng, place.lat]
					}
				}))
			});
			ensure(map, colors);
			markersRef.current.forEach((marker) => marker.remove());
			markersRef.current = [];
			const Marker = mlRef.current?.Marker;
			if (!Marker) return;
			const add = (lng, lat, kind) => {
				const marker = new Marker({
					element: markerEl(kind),
					anchor: "center"
				}).setLngLat([lng, lat]).addTo(map);
				markersRef.current.push(marker);
			};
			if (state.user) add(state.user.lng, state.user.lat, "user");
			add(state.origin.lng, state.origin.lat, "origin");
			state.stops.forEach((stop) => add(stop.lng, stop.lat, "stop"));
			if (state.destination) add(state.destination.lng, state.destination.lat, "dest");
			else if (state.selected) add(state.selected.lng, state.selected.lat, "selected");
			if (state.guideOn) {
				const routes = state.routesByMode[state.mode] ?? [];
				const step = (routes[state.routeIndex] ?? routes[0])?.steps[state.guideIndex];
				if (step && (step.lng || step.lat)) add(step.lng, step.lat, "guide");
			}
		};
		map.on("style.load", sync);
		sync();
		return () => {
			map.off("style.load", sync);
		};
	}, [overlayKey, ready]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute inset-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: wrapRef,
			id: "meridian-map",
			className: "absolute inset-0"
		}), failed && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 grid place-items-center px-8 text-center",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-xs text-sm text-muted",
				children: "Cette vue ne peut pas ouvrir le globe WebGL. La recherche reste disponible."
			})
		})]
	});
}
function put(map, id, data) {
	const source = map.getSource(id);
	if (source) source.setData(data);
	else map.addSource(id, {
		type: "geojson",
		data
	});
}
function ensure(map, colors) {
	if (!map.getLayer("iso")) {
		map.addLayer({
			id: "iso",
			type: "fill",
			source: "iso",
			paint: {
				"fill-color": "#8eb4c4",
				"fill-opacity": .16
			}
		});
		map.addLayer({
			id: "iso-line",
			type: "line",
			source: "iso",
			paint: {
				"line-color": "#5d7c8a",
				"line-width": 1.25
			}
		});
	}
	if (!map.getLayer("alt")) map.addLayer({
		id: "alt",
		type: "line",
		source: "alt",
		paint: {
			"line-color": colors.alt,
			"line-width": 3,
			"line-opacity": .55,
			"line-dasharray": [1.4, 1.1]
		},
		layout: {
			"line-cap": "round",
			"line-join": "round"
		}
	});
	if (!map.getLayer("route")) {
		map.addLayer({
			id: "route-casing",
			type: "line",
			source: "route",
			paint: {
				"line-color": colors.casing,
				"line-width": 8,
				"line-opacity": .85
			},
			layout: {
				"line-cap": "round",
				"line-join": "round"
			}
		});
		map.addLayer({
			id: "route",
			type: "line",
			source: "route",
			paint: {
				"line-color": colors.line,
				"line-width": 4
			},
			layout: {
				"line-cap": "round",
				"line-join": "round"
			}
		});
	}
	if (!map.getLayer("measure")) map.addLayer({
		id: "measure",
		type: "line",
		source: "measure",
		paint: {
			"line-color": "#172028",
			"line-width": 2.5,
			"line-dasharray": [.6, 1.1]
		}
	});
	if (!map.getLayer("poi")) map.addLayer({
		id: "poi",
		type: "circle",
		source: "poi",
		paint: {
			"circle-radius": 6,
			"circle-color": colors.poi,
			"circle-stroke-width": 2,
			"circle-stroke-color": "#f2f4f6"
		}
	});
	map.setPaintProperty("route", "line-color", colors.line);
	map.setPaintProperty("route-casing", "line-color", colors.casing);
	map.setPaintProperty("alt", "line-color", colors.alt);
	map.setPaintProperty("poi", "circle-color", colors.poi);
	map.setPaintProperty("measure", "line-color", colors.line);
}
function MeridianApp() {
	(0, import_react.useEffect)(() => {
		hydrateMeridian();
		useMeridian.setState({ departAt: clockNow() });
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "frame relative h-dvh overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapView, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Controls, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dock, {})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MeridianApp, {});
}
//#endregion
export { Home as component };
