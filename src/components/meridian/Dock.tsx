import { useEffect, useRef, type ReactNode } from "react";
import {
  ArrowLeftRight,
  Bookmark,
  Briefcase,
  ChevronLeft,
  Home,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  arm,
  choosePlace,
  clearRoute,
  closeToHome,
  departFrom,
  exploreCategory,
  moveGuide,
  openGuide,
  removeStop,
  routeTo,
  runSearch,
  saveFavorite,
  setIsochrone,
  setIsochroneMin,
  setMode,
  setQuery,
  setRouteIndex,
  setSlot,
  showGuideStep,
  stopGuide,
  swapEnds,
  useMapCenterAsOrigin,
  notify,
} from "@/lib/maps/actions";
import {
  adjustedDrive,
  ATLASES,
  CATEGORIES,
  footprint,
  formatDistance,
  formatDuration,
  haversine,
  MODES,
  nearbyMarks,
  sunLine,
  trafficAt,
  dateFromClock,
  type Place,
  type TravelMode,
} from "@/lib/maps/model";
import { useMeridian } from "@/lib/maps/store";
import { cx } from "@/lib/cx";

export function SearchField() {
  const query = useMeridian((s) => s.query);
  const intent = useMeridian((s) => s.intent);
  const focusNonce = useMeridian((s) => s.focusNonce);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = window.setTimeout(() => void runSearch(q), 360);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (focusNonce) ref.current?.focus();
  }, [focusNonce]);

  const placeholder =
    intent === "origin" ? "Nouveau départ" : intent === "stop" ? "Ajouter un arrêt" : "Lieu, adresse, ville";

  return (
    <form
      className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-bg px-3 focus-within:border-ink"
      onSubmit={(event) => {
        event.preventDefault();
        const q = query.trim();
        if (q.length >= 2) void runSearch(q);
      }}
    >
      <Search className="size-4 shrink-0 text-subtle" strokeWidth={1.75} aria-hidden />
      <input
        ref={ref}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label="Rechercher un lieu"
        autoComplete="off"
        enterKeyHint="search"
        className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-subtle"
        data-testid="search"
      />
      {query && (
        <button type="button" className="grid size-8 place-items-center text-muted" onClick={() => setQuery("")} aria-label="Effacer">
          <X className="size-4" strokeWidth={1.75} />
        </button>
      )}
    </form>
  );
}

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="size-8 text-fg" aria-hidden>
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 19c3.2-7 14.8-7 18 0" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="16" cy="13.5" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function Dock() {
  const panel = useMeridian((s) => s.panel);
  const notice = useMeridian((s) => s.notice);
  return (
    <aside
      className={cx(
        "dock shadow-panel absolute z-20 flex flex-col overflow-hidden rounded-3xl border border-line bg-surface",
        panel === "home" ? "sheet-home" : "sheet-open",
      )}
    >
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line" aria-hidden />
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <Mark />
        <div className="min-w-0">
          <h1 className="font-display text-2xl leading-none tracking-tight text-fg">Meridian</h1>
          <p className="mt-1 text-xs text-subtle">Atlas vivant</p>
        </div>
      </div>
      <div className="px-4 pt-3 pb-3">
        <SearchField />
      </div>
      <div className="scroll-y min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {notice && (
          <p className="mb-3 rounded-lg bg-bg px-3 py-2 text-sm text-fg" role="status">
            {notice}
          </p>
        )}
        {panel === "home" && <HomePanel />}
        {panel === "results" && <ResultsPanel />}
        {panel === "place" && <PlacePanel />}
        {panel === "route" && <RoutePanel />}
        {panel === "atlas" && <AtlasPanel />}
      </div>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-4">
      <h2 className="text-xs font-medium tracking-widest text-subtle uppercase">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
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

  return (
    <div>
      <div className="rounded-xl bg-bg px-3 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm text-muted">Fluidité estimée</p>
          <p className="text-sm font-medium text-fg">{traffic.title}</p>
        </div>
        <p className="mt-1 text-xs text-subtle">{traffic.detail}. Ce n'est pas un trafic live.</p>
      </div>

      <div className="scroll-x mt-3 flex gap-2 overflow-x-auto">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            aria-pressed={activeCategory === category.id}
            onClick={() => void exploreCategory(category.id, category.q, category.label)}
            className={cx(
              "h-10 shrink-0 rounded-lg border px-3 text-sm",
              activeCategory === category.id
                ? "border-accent bg-accent text-accent-fg"
                : "border-line bg-surface text-fg",
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <SlotButton label="Maison" place={home} icon={<Home className="size-4" strokeWidth={1.75} />} />
        <SlotButton label="Travail" place={work} icon={<Briefcase className="size-4" strokeWidth={1.75} />} />
      </div>

      {marks.length > 0 && (
        <Section title="Repères proches">
          <div className="scroll-x -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {marks.map((place) => (
              <button
                key={place.id}
                type="button"
                onClick={() => choosePlace(place)}
                className="w-36 shrink-0 rounded-xl border border-line px-3 py-3 text-left"
              >
                <span className="block truncate text-sm font-medium text-fg">{place.name}</span>
                <span className="mt-1 block truncate text-xs text-subtle">{place.subtitle}</span>
              </button>
            ))}
          </div>
        </Section>
      )}

      {favorites.length > 0 && (
        <Section title="Favoris">
          <ul className="divide-y divide-line">
            {favorites.map((place) => (
              <li key={place.id}>
                <PlaceRow place={place} meta={place.subtitle} onClick={() => choosePlace(place)} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {recents.length > 0 && (
        <Section title="Récents">
          <ul className="divide-y divide-line">
            {recents.map((place) => (
              <li key={place.id}>
                <PlaceRow place={place} meta={place.subtitle} onClick={() => choosePlace(place)} />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function SlotButton({ label, place, icon }: { label: string; place: Place | null; icon: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (place) void routeTo(place);
        else notify(`Ouvrez un lieu, puis définissez « ${label} ».`);
      }}
      className="flex h-14 items-center gap-2 rounded-xl border border-line px-3 text-left"
    >
      <span className="text-muted">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs text-subtle">{label}</span>
        <span className="block truncate text-sm text-fg">{place ? place.name : "À définir"}</span>
      </span>
    </button>
  );
}

function PlaceRow({
  place,
  meta,
  index,
  onClick,
}: {
  place: Place;
  meta: string;
  index?: number;
  onClick: () => void;
}) {
  const origin = useMeridian((s) => s.origin);
  const distance = formatDistance(haversine(origin.lng, origin.lat, place.lng, place.lat));
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-3 py-3 text-left" data-testid="result">
      {index != null && <span className="w-6 font-mono text-xs text-subtle">{String(index).padStart(2, "0")}</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">{place.name}</span>
        <span className="block truncate text-xs text-subtle">{meta}</span>
      </span>
      <span className="shrink-0 text-xs text-muted tabular-nums">{distance}</span>
    </button>
  );
}

function ResultsPanel() {
  const results = useMeridian((s) => s.results);
  const label = useMeridian((s) => s.resultsLabel);
  const status = useMeridian((s) => s.searchStatus);
  const query = useMeridian((s) => s.query);
  const activeCategory = useMeridian((s) => s.activeCategory);
  const intent = useMeridian((s) => s.intent);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <button type="button" onClick={closeToHome} className="inline-flex items-center gap-1 text-sm text-muted">
          <ChevronLeft className="size-4" />
          Atlas
        </button>
        <p className="truncate text-xs text-subtle">{label}</p>
      </div>
      {status === "loading" && <p className="py-6 text-sm text-muted">Recherche…</p>}
      {status !== "loading" && results.length === 0 && (activeCategory || query.trim().length >= 2) && (
        <p className="py-6 text-sm text-muted">Aucun lieu dans ce cadrage.</p>
      )}
      {status !== "loading" && results.length === 0 && !activeCategory && query.trim().length < 2 && (
        <p className="py-6 text-sm text-muted">
          {intent ? "Saisissez le lieu, puis choisissez-le dans la liste." : "Saisissez au moins deux lettres."}
        </p>
      )}
      <ul className="divide-y divide-line">
        {results.map((place) => (
          <li key={place.id}>
            <PlaceRow place={place} meta={place.subtitle} onClick={() => choosePlace(place)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlacePanel() {
  const place = useMeridian((s) => s.selected);
  const origin = useMeridian((s) => s.origin);
  const favorites = useMeridian((s) => s.favorites);
  if (!place) return null;
  const saved = favorites.some((item) => item.id === place.id);
  const distance = formatDistance(haversine(origin.lng, origin.lat, place.lng, place.lat));

  return (
    <div>
      <button type="button" onClick={closeToHome} className="inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" />
        Atlas
      </button>
      <h2 className="font-display mt-3 text-3xl leading-tight tracking-tight text-fg">{place.name}</h2>
      <p className="mt-1 text-sm text-muted">{place.subtitle}</p>
      <p className="mt-3 text-sm text-fg tabular-nums">{distance} du départ</p>
      <p className="mt-3 text-xs tracking-widest text-subtle uppercase">Lumière · votre heure</p>
      <p className="mt-1 text-sm text-fg">{sunLine(place.lat, place.lng)}</p>
      <button
        type="button"
        data-testid="go"
        onClick={() => void routeTo(place)}
        className="mt-4 h-12 w-full rounded-xl bg-accent text-sm font-medium text-accent-fg"
      >
        Itinéraire
      </button>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Mini onClick={() => setSlot("home", place)} icon={<Home className="size-4" />} label="Maison" />
        <Mini onClick={() => setSlot("work", place)} icon={<Briefcase className="size-4" />} label="Travail" />
        <Mini
          onClick={() => saveFavorite(place)}
          icon={<Bookmark className="size-4" fill={saved ? "currentColor" : "none"} />}
          label={saved ? "Sauvé" : "Favori"}
        />
      </div>
      <button
        type="button"
        onClick={() => departFrom(place)}
        className="mt-2 h-11 w-full rounded-lg border border-line text-sm text-fg"
      >
        Partir d'ici
      </button>
      <p className="mt-3 text-xs text-subtle tabular-nums">
        {place.lat.toFixed(5)}, {place.lng.toFixed(5)}
      </p>
    </div>
  );
}

function Mini({ onClick, icon, label }: { onClick: () => void; icon: ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex h-16 flex-col items-center justify-center gap-1 rounded-lg border border-line text-xs text-muted">
      <span className="text-fg">{icon}</span>
      {label}
    </button>
  );
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
  const shown = route ? (mode === "driving" ? adjustedDrive(route.duration, traffic.factor) : route.duration) : 0;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button type="button" onClick={clearRoute} className="inline-flex items-center gap-1 text-sm text-muted">
          <ChevronLeft className="size-4" />
          Fermer
        </button>
        <button type="button" onClick={swapEnds} className="inline-flex items-center gap-1 text-sm text-fg" aria-label="Inverser départ et arrivée">
          <ArrowLeftRight className="size-4" />
          Inverser
        </button>
      </div>

      <button type="button" onClick={() => arm("origin")} className="flex w-full items-center gap-3 py-2 text-left">
        <span className="size-2 rounded-full bg-ink" />
        <span className="min-w-0">
          <span className="block text-xs text-subtle">Départ</span>
          <span className="block truncate text-sm text-fg">{origin.name}</span>
        </span>
      </button>
      {stops.map((stop, index) => (
        <div key={stop.id} className="flex items-center gap-3 py-2">
          <span className="size-2 rounded-full border border-line" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs text-subtle">Arrêt {index + 1}</span>
            <span className="block truncate text-sm text-fg">{stop.name}</span>
          </span>
          <button type="button" aria-label="Retirer l'arrêt" onClick={() => removeStop(stop.id)} className="text-subtle">
            <X className="size-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => arm("destination")} className="flex w-full items-center gap-3 py-2 text-left">
        <span className="size-2 rounded-full bg-fg" />
        <span className="min-w-0">
          <span className="block text-xs text-subtle">Arrivée</span>
          <span className="block truncate text-sm text-fg">{destination?.name ?? "Choisir"}</span>
        </span>
      </button>
      <button type="button" onClick={() => arm("stop")} className="mt-1 inline-flex items-center gap-1 text-sm text-muted">
        <Plus className="size-4" />
        Ajouter un arrêt
      </button>

      <div className="mt-4 grid grid-cols-3 gap-2" role="tablist" aria-label="Mode">
        {MODES.map((item) => {
          const option = routesByMode[item.id]?.[0];
          const duration = option
            ? formatDuration(item.id === "driving" ? adjustedDrive(option.duration, traffic.factor) : option.duration)
            : routeStatus === "loading"
              ? "…"
              : "—";
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(item.id as TravelMode)}
              className={cx(
                "rounded-xl border px-2 py-2 text-left",
                active ? "border-accent bg-accent text-accent-fg" : "border-line text-fg",
              )}
            >
              <span className="block text-xs">{item.label}</span>
              <span className="mt-1 block text-sm font-medium tabular-nums">{duration}</span>
            </button>
          );
        })}
      </div>

      {routeStatus === "loading" && <p className="mt-4 text-sm text-muted">Tracé des trois modes…</p>}
      {routeStatus === "error" && !route && (
        <p className="mt-4 text-sm text-muted">Pas de tracé pour cette combinaison. Changez de mode ou de points.</p>
      )}

      {route && (
        <div className="mt-4">
          <p className="font-display text-4xl leading-none tabular-nums text-fg">{formatDuration(shown)}</p>
          <p className="mt-2 text-sm text-muted tabular-nums">
            {formatDistance(route.distance)} · {footprint(mode, route.distance).label} {footprint(mode, route.distance).value}
          </p>
          {mode === "driving" && (
            <p className="mt-1 text-xs text-subtle tabular-nums">
              Réseau libre {formatDuration(route.duration)} · retenu {formatDuration(shown)} ({traffic.title.toLowerCase()})
            </p>
          )}

          {routes.length > 1 && (
            <div className="mt-3 flex flex-col gap-2">
              {routes.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRouteIndex(index)}
                  className={cx(
                    "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                    index === routeIndex ? "border-ink text-fg" : "border-line text-muted",
                  )}
                >
                  <span>{index === 0 ? "Plus rapide" : `Variante ${index + 1}`}</span>
                  <span className="tabular-nums">
                    {formatDuration(mode === "driving" ? adjustedDrive(option.duration, traffic.factor) : option.duration)}
                  </span>
                </button>
              ))}
            </div>
          )}

          <label className="mt-4 flex items-center justify-between gap-3 text-sm text-muted">
            Partir à
            <input
              type="time"
              value={departAt}
              onChange={(event) => useMeridian.setState({ departAt: event.target.value })}
              className="h-10 rounded-lg border border-line bg-bg px-2 text-fg"
            />
          </label>
          <p className="mt-1 text-xs text-subtle">{traffic.detail}</p>

          <button
            type="button"
            className="mt-4 h-11 w-full rounded-xl bg-accent text-sm font-medium text-accent-fg"
            onClick={() => (guideOn ? stopGuide() : openGuide())}
          >
            {guideOn ? "Quitter le guidage" : "Suivre étape par étape"}
          </button>
          {guideOn && route.steps[guideIndex] && (
            <div className="mt-3 flex items-center gap-2">
              <button type="button" className="h-10 flex-1 rounded-lg border border-line text-sm text-fg" onClick={() => moveGuide(-1)}>
                Précédent
              </button>
              <button type="button" className="h-10 flex-1 rounded-lg border border-line text-sm text-fg" onClick={() => moveGuide(1)}>
                Suivant
              </button>
            </div>
          )}

          <button
            type="button"
            className="mt-4 text-sm font-medium text-fg"
            onClick={() => useMeridian.setState({ stepsOpen: !stepsOpen })}
          >
            {stepsOpen ? "Masquer la feuille de route" : "Feuille de route"}
          </button>
          {stepsOpen && (
            <ol className="mt-2 divide-y divide-line">
              {route.steps.map((step, index) => (
                <li key={`${step.instruction}-${index}`}>
                  <button
                    type="button"
                    onClick={() => showGuideStep(index)}
                    className={cx(
                      "flex w-full items-baseline justify-between gap-3 py-2 text-left",
                      guideOn && index === guideIndex ? "text-fg" : "text-muted",
                    )}
                  >
                    <span className={cx("text-sm", guideOn && index === guideIndex && "font-medium text-fg")}>
                      {step.instruction}
                    </span>
                    <span className="shrink-0 text-xs text-subtle tabular-nums">{formatDistance(step.distance)}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      <button type="button" onClick={useMapCenterAsOrigin} className="mt-4 text-xs text-subtle">
        Utiliser le centre de la carte comme départ
      </button>
    </div>
  );
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

  return (
    <div>
      <button type="button" onClick={closeToHome} className="inline-flex items-center gap-1 text-sm text-muted">
        <ChevronLeft className="size-4" />
        Atlas
      </button>
      <h2 className="mt-3 text-sm font-medium text-fg">Fonds</h2>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {ATLASES.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => useMeridian.setState({ atlas: item.id })}
            className={cx(
              "rounded-xl border p-3 text-left",
              atlas === item.id ? "border-accent bg-bg" : "border-line",
            )}
          >
            <span className={cx("mb-3 block h-8 rounded-md", `swatch-${item.id}`)} />
            <span className="block text-sm text-fg">{item.label}</span>
            <span className="block text-xs text-subtle">{item.detail}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <Toggle
          on={globe}
          label="Globe"
          detail="Courbure à petite échelle"
          onClick={() => useMeridian.setState({ globe: !globe })}
        />
        <Toggle
          on={pitch3d}
          label="Inclinaison"
          detail="Vue oblique des rues"
          onClick={() => useMeridian.setState({ pitch3d: !pitch3d })}
        />
        <Toggle
          on={measuring}
          label="Mesure"
          detail="Touchez la carte pour tracer"
          onClick={() => useMeridian.setState({ measuring: !measuring })}
        />
      </div>

      <h2 className="mt-5 text-sm font-medium text-fg">Bassins de temps</h2>
      <p className="mt-1 text-xs text-subtle">
        Zone atteignable depuis le départ, sur le réseau quand le service répond.
      </p>
      <div className="mt-2 flex gap-2">
        {([10, 15, 30] as const).map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => setIsochroneMin(minutes)}
            className={cx(
              "h-10 flex-1 rounded-lg border text-sm tabular-nums",
              isochroneOn && isochroneMin === minutes ? "border-accent bg-accent text-accent-fg" : "border-line text-fg",
            )}
          >
            {minutes} min
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setIsochrone(!isochroneOn)}
        className="mt-2 h-10 w-full rounded-lg border border-line text-sm text-fg"
      >
        {isochroneStatus === "loading" ? "Calcul…" : isochroneOn ? "Masquer le bassin" : "Afficher le bassin"}
      </button>
      {isochroneOn && isochroneStatus === "idle" && (
        <p className="mt-2 text-xs text-subtle">
          {isochroneReal ? "Calculé sur le réseau routier ou piéton." : "Anneau estimé : le service de bassins n'a pas répondu."}
        </p>
      )}
    </div>
  );
}

function Toggle({ on, label, detail, onClick }: { on: boolean; label: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-3 text-left">
      <span>
        <span className="block text-sm text-fg">{label}</span>
        <span className="block text-xs text-subtle">{detail}</span>
      </span>
      <span className={cx("h-6 w-11 rounded-full p-0.5", on ? "bg-accent" : "bg-line")}>
        <span className={cx("block size-5 rounded-full bg-bg transition-transform", on && "translate-x-5")} />
      </span>
    </button>
  );
}
