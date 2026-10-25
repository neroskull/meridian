import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { b as stepInstruction, u as fallbackBasin } from "./model-B5Gm8WMb.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/geo-Bd2gtqkS.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var UA = "Meridian/1.0 (atlas cartographique; +https://grok.com)";
var cache = /* @__PURE__ */ new Map();
function remember(key, ttlMs, data) {
	cache.set(key, {
		exp: Date.now() + ttlMs,
		data
	});
	if (cache.size > 180) {
		const oldest = cache.keys().next().value;
		if (oldest) cache.delete(oldest);
	}
	return data;
}
function recall(key) {
	const hit = cache.get(key);
	if (!hit) return void 0;
	if (hit.exp < Date.now()) {
		cache.delete(key);
		return;
	}
	return hit.data;
}
async function getJson(url, init) {
	const response = await fetch(url, {
		...init,
		headers: {
			Accept: "application/json",
			"User-Agent": UA,
			...init?.headers ?? {}
		},
		signal: AbortSignal.timeout(12e3)
	});
	if (!response.ok) throw new Error(`Service indisponible (${response.status})`);
	return response.json();
}
function cleanQuery(value) {
	return value.replace(/[^\p{L}\p{N}\s,''.-]/gu, "").trim().slice(0, 80);
}
function asNumber(value, min, max) {
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n) || n < min || n > max) throw new Error("Coordonnée invalide");
	return n;
}
function toPlace(item) {
	const lat = Number(item.lat);
	const lng = Number(item.lon);
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
	const address = item.address ?? {};
	const city = address.city || address.town || address.village || address.municipality || address.state || "";
	const subtitle = [
		address.road || address.pedestrian || address.neighbourhood || "",
		address.postcode,
		city
	].filter(Boolean).slice(0, 3).join(" · ");
	const display = item.display_name?.split(",").slice(1, 3).join(" · ").trim() ?? "";
	const name = item.name || item.display_name?.split(",")[0]?.trim() || "Lieu";
	return {
		id: item.place_id ? `osm:${item.place_id}` : `${lat.toFixed(5)}:${lng.toFixed(5)}`,
		name,
		subtitle: subtitle || display || item.type || "Lieu",
		lng,
		lat
	};
}
async function nominatim(params) {
	const url = new URL("https://nominatim.openstreetmap.org/search");
	url.searchParams.set("format", "jsonv2");
	url.searchParams.set("addressdetails", "1");
	url.searchParams.set("accept-language", "fr");
	url.searchParams.set("limit", "8");
	for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
	const key = url.toString();
	const cached = recall(key);
	if (cached) return cached;
	return remember(key, 12e4, (await getJson(url.toString())).map(toPlace).filter((place) => place !== null));
}
var searchPlaces_createServerFn_handler = createServerRpc({
	id: "97fa10f34c713124b1f4bf433ba27525e66e6e94ce71722fc124a9bebce103c6",
	name: "searchPlaces",
	filename: "src/lib/maps/geo.ts"
}, (opts) => searchPlaces.__executeServer(opts));
var searchPlaces = createServerFn({ method: "POST" }).validator((data) => {
	const q = cleanQuery(data?.q ?? "");
	if (q.length < 2) throw new Error("Requête trop courte");
	return {
		q,
		lng: asNumber(data?.lng, -180, 180),
		lat: asNumber(data?.lat, -85, 85)
	};
}).handler(searchPlaces_createServerFn_handler, async ({ data }) => {
	const dLng = .55;
	const dLat = .35;
	return nominatim({
		q: data.q,
		viewbox: `${data.lng - dLng},${data.lat + dLat},${data.lng + dLng},${data.lat - dLat}`,
		bounded: "0"
	});
});
var searchNearby_createServerFn_handler = createServerRpc({
	id: "5d073880408dd28cd57b454214edd61d267fc08ff45fcddcd84c8eda331e9b91",
	name: "searchNearby",
	filename: "src/lib/maps/geo.ts"
}, (opts) => searchNearby.__executeServer(opts));
var searchNearby = createServerFn({ method: "POST" }).validator((data) => {
	const q = cleanQuery(data?.q ?? "");
	if (q.length < 2) throw new Error("Catégorie invalide");
	return {
		q,
		lng: asNumber(data?.lng, -180, 180),
		lat: asNumber(data?.lat, -85, 85)
	};
}).handler(searchNearby_createServerFn_handler, async ({ data }) => {
	const dLng = .06;
	const dLat = .04;
	return nominatim({
		q: data.q,
		viewbox: `${data.lng - dLng},${data.lat + dLat},${data.lng + dLng},${data.lat - dLat}`,
		bounded: "1"
	});
});
var reversePlace_createServerFn_handler = createServerRpc({
	id: "ff42c7fe19a21e98cec967617442418d1b129e84136f053b3aa87a8530a0c633",
	name: "reversePlace",
	filename: "src/lib/maps/geo.ts"
}, (opts) => reversePlace.__executeServer(opts));
var reversePlace = createServerFn({ method: "POST" }).validator((data) => ({
	lng: asNumber(data?.lng, -180, 180),
	lat: asNumber(data?.lat, -85, 85)
})).handler(reversePlace_createServerFn_handler, async ({ data }) => {
	const key = `rev:${data.lat.toFixed(4)}:${data.lng.toFixed(4)}`;
	const cached = recall(key);
	if (cached !== void 0) return cached;
	const url = new URL("https://nominatim.openstreetmap.org/reverse");
	url.searchParams.set("format", "jsonv2");
	url.searchParams.set("lat", String(data.lat));
	url.searchParams.set("lon", String(data.lng));
	url.searchParams.set("zoom", "18");
	url.searchParams.set("addressdetails", "1");
	url.searchParams.set("accept-language", "fr");
	try {
		return remember(key, 12e4, toPlace({
			...await getJson(url.toString()),
			lat: String(data.lat),
			lon: String(data.lng)
		}));
	} catch {
		return remember(key, 2e4, null);
	}
});
var planRoute_createServerFn_handler = createServerRpc({
	id: "0e81ec9bd0c00be9814691ba7b9147e3c2251c4faa24def287cda73d7f33e2e7",
	name: "planRoute",
	filename: "src/lib/maps/geo.ts"
}, (opts) => planRoute.__executeServer(opts));
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
}).handler(planRoute_createServerFn_handler, async ({ data }) => {
	const profile = data.mode === "cycling" ? "cycling" : data.mode === "walking" ? "walking" : "driving";
	const coordPath = data.points.map((point) => `${point.lng},${point.lat}`).join(";");
	const key = `${profile}:${coordPath}`;
	const cached = recall(key);
	if (cached) return cached;
	const json = await getJson(`https://router.project-osrm.org/route/v1/${profile}/${coordPath}?overview=full&geometries=geojson&steps=true&alternatives=true`);
	if (json.code !== "Ok" || !json.routes?.length) return remember(key, 3e4, []);
	return remember(key, 6e4, json.routes.slice(0, 3).flatMap((route, index) => {
		const coordinates = route.geometry?.coordinates ?? [];
		if (coordinates.length < 2) return [];
		const steps = (route.legs ?? []).flatMap((leg) => (leg.steps ?? []).map((step) => ({
			instruction: stepInstruction(step),
			distance: step.distance ?? 0,
			duration: step.duration ?? 0,
			lng: step.maneuver?.location?.[0] ?? 0,
			lat: step.maneuver?.location?.[1] ?? 0
		})));
		return [{
			id: `${profile}-${index}`,
			distance: route.distance ?? 0,
			duration: route.duration ?? 0,
			geometry: {
				type: "LineString",
				coordinates
			},
			steps
		}];
	}));
});
var loadBasin_createServerFn_handler = createServerRpc({
	id: "2ce57ba480d565415b7f258848ec2fcbfc7961343beef2b3cf122a0aa2b665a2",
	name: "loadBasin",
	filename: "src/lib/maps/geo.ts"
}, (opts) => loadBasin.__executeServer(opts));
var loadBasin = createServerFn({ method: "POST" }).validator((data) => {
	const mode = data?.mode;
	if (mode !== "driving" && mode !== "cycling" && mode !== "walking") throw new Error("Mode invalide");
	return {
		mode,
		minutes: data?.minutes === 10 || data?.minutes === 30 ? data.minutes : 15,
		lng: asNumber(data?.lng, -180, 180),
		lat: asNumber(data?.lat, -85, 85)
	};
}).handler(loadBasin_createServerFn_handler, async ({ data }) => {
	const costing = data.mode === "driving" ? "auto" : data.mode === "cycling" ? "bicycle" : "pedestrian";
	const key = `iso:${costing}:${data.minutes}:${data.lat.toFixed(3)}:${data.lng.toFixed(3)}`;
	const cached = recall(key);
	if (cached) return cached;
	const half = Math.max(5, Math.round(data.minutes / 2));
	try {
		const features = ((await getJson("https://valhalla1.openstreetmap.de/isochrone", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				locations: [{
					lat: data.lat,
					lon: data.lng
				}],
				costing,
				contours: [{ time: half }, { time: data.minutes }],
				polygons: true,
				denoise: .35,
				generalize: 40
			})
		})).features ?? []).filter((feature) => feature.geometry?.type === "Polygon" || feature.geometry?.type === "MultiPolygon");
		if (!features.length) throw new Error("Bassin vide");
		return remember(key, 18e4, {
			real: true,
			collection: {
				type: "FeatureCollection",
				features
			}
		});
	} catch {
		return remember(key, 3e4, {
			real: false,
			collection: fallbackBasin(data.lng, data.lat, data.mode, data.minutes)
		});
	}
});
//#endregion
export { loadBasin_createServerFn_handler, planRoute_createServerFn_handler, reversePlace_createServerFn_handler, searchNearby_createServerFn_handler, searchPlaces_createServerFn_handler };
