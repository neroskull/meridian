import { useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MlMap, Marker as MlMarker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { selectOnMap, choosePlace, pauseGpsFollow } from "@/lib/maps/actions";
import { atlasUrl, lineColors, PARIS_ORIGIN } from "@/lib/maps/model";
import { useMeridian } from "@/lib/maps/store";

type Data = Parameters<GeoJSONSource["setData"]>[0];

const EMPTY: Data = { type: "FeatureCollection", features: [] };

function pad() {
  if (typeof window !== "undefined" && window.matchMedia("(min-width: 960px)").matches) {
    return { top: 72, bottom: 48, left: 420, right: 72 };
  }
  return { top: 72, bottom: 280, left: 20, right: 64 };
}

function markerEl(kind: string) {
  const el = document.createElement("div");
  el.className = `pin pin-${kind}`;
  el.addEventListener("pointerdown", (event) => event.stopPropagation());
  el.addEventListener("click", (event) => event.stopPropagation());
  return el;
}

export function MapView() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markersRef = useRef<MlMarker[]>([]);
  const mlRef = useRef<typeof import("maplibre-gl") | null>(null);
  const styleRef = useRef<string>("");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const atlas = useMeridian((s) => s.atlas);
  const globe = useMeridian((s) => s.globe);
  const pitch3d = useMeridian((s) => s.pitch3d);
  const camera = useMeridian((s) => s.camera);
  const northNonce = useMeridian((s) => s.northNonce);
  const overlayKey = useMeridian((s) =>
    [
      s.atlas,
      s.mode,
      s.routeIndex,
      s.origin.id,
      s.origin.lng,
      s.origin.lat,
      s.destination?.id ?? "",
      s.stops.map((stop) => stop.id).join(","),
      s.selected?.id ?? "",
      s.user ? `${s.user.lng.toFixed(5)},${s.user.lat.toFixed(5)}` : "",
      s.measuring ? "m" : "",
      s.measure.map((p) => p.join(":")).join("|"),
      s.pois.map((p) => p.id).join(","),
      s.isochrone ? s.isochrone.features.length : 0,
      s.isochroneOn ? "on" : "off",
      s.routesByMode[s.mode]?.[s.routeIndex]?.id ?? "",
      s.routesByMode.walking?.[0]?.distance ?? 0,
      s.routesByMode.cycling?.[0]?.distance ?? 0,
      s.routesByMode.driving?.[0]?.distance ?? 0,
      s.guideOn ? `g${s.guideIndex}` : "",
    ].join("~"),
  );

  useEffect(() => {
    const container = wrapRef.current;
    if (!container) return;
    let cancelled = false;
    let map: MlMap | null = null;
    const initial = atlasUrl(useMeridian.getState().atlas);
    styleRef.current = initial;

    let observer: ResizeObserver | null = null;
    void import("maplibre-gl").then((ml) => {
      if (cancelled || !wrapRef.current) return;
      mlRef.current = ml;
      ml.setWorkerUrl(workerUrl);
      try {
        map = new ml.Map({
          container: wrapRef.current,
          style: initial,
          center: [PARIS_ORIGIN.lng, PARIS_ORIGIN.lat],
          zoom: 12.7,
          attributionControl: false,
          maxPitch: 68,
          fadeDuration: 0,
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
      live.on("error", () => {
        /* tile errors stay inside the map; chrome remains usable */
      });
      live.on("dragstart", () => pauseGpsFollow());
      live.on("rotate", () => useMeridian.setState({ bearing: live.getBearing() }));
      live.on("moveend", () => {
        const center = live.getCenter();
        useMeridian.setState({
          viewport: { lng: center.lng, lat: center.lat, zoom: live.getZoom() },
          bearing: live.getBearing(),
        });
      });
      live.on("click", (event) => {
        const current = useMeridian.getState();
        if (!current.measuring && live.getLayer("poi")) {
          const hits = live.queryRenderedFeatures(event.point, { layers: ["poi"] });
          const id = hits[0]?.properties?.id;
          if (typeof id === "string") {
            const place = useMeridian.getState().pois.find((item) => item.id === id);
            if (place) {
              choosePlace(place);
              return;
            }
          }
        }
        void selectOnMap(event.lngLat.lng, event.lngLat.lat);
      });
      live.on("mousemove", (event) => {
        const measuring = useMeridian.getState().measuring;
        const over =
          !measuring && live.getLayer("poi")
            ? live.queryRenderedFeatures(event.point, { layers: ["poi"] }).length > 0
            : false;
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const url = atlasUrl(atlas);
    if (styleRef.current === url) return;
    styleRef.current = url;
    map.setStyle(url);
  }, [atlas, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    try {
      map.setProjection({ type: globe ? "globe" : "mercator" });
    } catch {
      /* globe is optional */
    }
  }, [globe, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    map.easeTo({ pitch: pitch3d ? 58 : 0, duration: 450 });
  }, [pitch3d, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !camera) return;
    if (camera.kind === "fly") {
      map.flyTo({
        center: [camera.lng, camera.lat],
        zoom: camera.zoom,
        padding: pad(),
        essential: true,
        duration: 900,
      });
      return;
    }
    map.fitBounds(camera.bounds, { padding: pad(), duration: 800, maxZoom: 16 });
  }, [camera, ready]);

  const gpsFollow = useMeridian((s) => s.gpsFollow);
  const userLng = useMeridian((s) => s.user?.lng ?? null);
  const userLat = useMeridian((s) => s.user?.lat ?? null);
  const userHeading = useMeridian((s) => s.user?.heading ?? null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !gpsFollow || userLng == null || userLat == null) return;
    map.easeTo({
      center: [userLng, userLat],
      bearing: userHeading ?? map.getBearing(),
      duration: 650,
      essential: true,
    });
  }, [gpsFollow, userLng, userLat, userHeading, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !northNonce) return;
    map.easeTo({ bearing: 0, duration: 400 });
  }, [northNonce, ready]);

  useEffect(() => {
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

      put(map, "iso", state.isochroneOn && state.isochrone ? (state.isochrone as Data) : EMPTY);
      put(map, "alt", {
        type: "FeatureCollection",
        features: alts.map((route) => ({
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        })),
      });
      put(map, "route", selected ? { type: "Feature", properties: {}, geometry: selected.geometry } : EMPTY);
      put(
        map,
        "measure",
        state.measure.length
          ? {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates: state.measure },
            }
          : EMPTY,
      );
      put(map, "poi", {
        type: "FeatureCollection",
        features: state.pois.map((place) => ({
          type: "Feature",
          properties: { id: place.id },
          geometry: { type: "Point", coordinates: [place.lng, place.lat] },
        })),
      });

      ensure(map, colors);

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      const Marker = mlRef.current?.Marker;
      if (!Marker) return;
      const add = (lng: number, lat: number, kind: string) => {
        const marker = new Marker({ element: markerEl(kind), anchor: "center" })
          .setLngLat([lng, lat])
          .addTo(map);
        markersRef.current.push(marker);
      };
      if (state.user) add(state.user.lng, state.user.lat, "user");
      add(state.origin.lng, state.origin.lat, "origin");
      state.stops.forEach((stop) => add(stop.lng, stop.lat, "stop"));
      if (state.destination) add(state.destination.lng, state.destination.lat, "dest");
      else if (state.selected) add(state.selected.lng, state.selected.lat, "selected");
      if (state.guideOn) {
        const routes = state.routesByMode[state.mode] ?? [];
        const route = routes[state.routeIndex] ?? routes[0];
        const step = route?.steps[state.guideIndex];
        if (step && (step.lng || step.lat)) add(step.lng, step.lat, "guide");
      }
    };

    map.on("style.load", sync);
    sync();
    return () => {
      map.off("style.load", sync);
    };
  }, [overlayKey, ready]);

  return (
    <div className="absolute inset-0">
      <div ref={wrapRef} id="meridian-map" className="absolute inset-0" />
      {failed && (
        <div className="absolute inset-0 grid place-items-center px-8 text-center">
          <p className="max-w-xs text-sm text-muted">
            Cette vue ne peut pas ouvrir le globe WebGL. La recherche reste disponible.
          </p>
        </div>
      )}
    </div>
  );
}

function put(map: MlMap, id: string, data: Data) {
  const source = map.getSource(id) as GeoJSONSource | undefined;
  if (source) source.setData(data);
  else map.addSource(id, { type: "geojson", data });
}

function ensure(map: MlMap, colors: ReturnType<typeof lineColors>) {
  if (!map.getLayer("iso")) {
    map.addLayer({
      id: "iso",
      type: "fill",
      source: "iso",
      paint: { "fill-color": "#8eb4c4", "fill-opacity": 0.16 },
    });
    map.addLayer({
      id: "iso-line",
      type: "line",
      source: "iso",
      paint: { "line-color": "#5d7c8a", "line-width": 1.25 },
    });
  }
  if (!map.getLayer("alt")) {
    map.addLayer({
      id: "alt",
      type: "line",
      source: "alt",
      paint: { "line-color": colors.alt, "line-width": 3, "line-opacity": 0.55, "line-dasharray": [1.4, 1.1] },
      layout: { "line-cap": "round", "line-join": "round" },
    });
  }
  if (!map.getLayer("route")) {
    map.addLayer({
      id: "route-casing",
      type: "line",
      source: "route",
      paint: { "line-color": colors.casing, "line-width": 8, "line-opacity": 0.85 },
      layout: { "line-cap": "round", "line-join": "round" },
    });
    map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      paint: { "line-color": colors.line, "line-width": 4 },
      layout: { "line-cap": "round", "line-join": "round" },
    });
  }
  if (!map.getLayer("measure")) {
    map.addLayer({
      id: "measure",
      type: "line",
      source: "measure",
      paint: { "line-color": "#172028", "line-width": 2.5, "line-dasharray": [0.6, 1.1] },
    });
  }
  if (!map.getLayer("poi")) {
    map.addLayer({
      id: "poi",
      type: "circle",
      source: "poi",
      paint: {
        "circle-radius": 6,
        "circle-color": colors.poi,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#f2f4f6",
      },
    });
  }
  map.setPaintProperty("route", "line-color", colors.line);
  map.setPaintProperty("route-casing", "line-color", colors.casing);
  map.setPaintProperty("alt", "line-color", colors.alt);
  map.setPaintProperty("poi", "circle-color", colors.poi);
  map.setPaintProperty("measure", "line-color", colors.line);
}
