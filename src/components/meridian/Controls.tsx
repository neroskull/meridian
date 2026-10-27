import { ChevronLeft, ChevronRight, Compass, Layers, LocateFixed, Ruler, Volume2, VolumeX, X } from "lucide-react";
import type { ReactNode } from "react";
import { allowGps, announceCurrent, cancelGpsAsk, clearMeasure, locate, moveGuide, stopGuide, toggleVoice, undoMeasure } from "@/lib/maps/actions";
import { formatDistance, formatDuration, pace, pathLength } from "@/lib/maps/model";
import { useMeridian } from "@/lib/maps/store";
import { cx } from "@/lib/cx";

export function Controls() {
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
  const step = guideOn ? route?.steps[guideIndex] : undefined;
  const gps = useMeridian((s) => s.gps);
  const gpsFollow = useMeridian((s) => s.gpsFollow);
  const accuracy = useMeridian((s) => s.user?.accuracy ?? null);
  const voiceOn = useMeridian((s) => s.voiceOn);
  const voiceStatus = useMeridian((s) => s.voiceStatus);

  return (
    <>
      <div className="map-tools absolute z-20 flex flex-col gap-2">
        <IconButton label={gps === "live" ? "Mode GPS" : "Activer le GPS"} pressed={gps === "live" && gpsFollow} onClick={locate}>
          <LocateFixed className="size-5" strokeWidth={1.75} />
        </IconButton>
        <IconButton label={voiceOn ? "Couper la voix" : "Activer la voix"} pressed={voiceOn} onClick={toggleVoice}>
          {voiceOn ? <Volume2 className="size-5" strokeWidth={1.75} /> : <VolumeX className="size-5" strokeWidth={1.75} />}
        </IconButton>
        <IconButton
          label="Recaler au nord"
          onClick={() => useMeridian.setState({ northNonce: Date.now() })}
        >
          <Compass className="size-5" strokeWidth={1.75} style={{ transform: `rotate(${-bearing}deg)` }} />
        </IconButton>
        <IconButton
          label={measuring ? "Quitter la mesure" : "Mesurer"}
          pressed={measuring}
          onClick={() => useMeridian.setState({ measuring: !measuring })}
        >
          <Ruler className="size-5" strokeWidth={1.75} />
        </IconButton>
        <IconButton
          label="Fonds et bassins"
          pressed={panel === "atlas"}
          onClick={() => useMeridian.setState({ panel: panel === "atlas" ? "home" : "atlas" })}
        >
          <Layers className="size-5" strokeWidth={1.75} />
        </IconButton>
      </div>

      {(gps === "ask" || gps === "denied") && (
        <div className="gps-card shadow-panel absolute z-30 rounded-2xl border border-line bg-surface px-4 py-3" role="dialog" aria-labelledby="gps-title">
          <p id="gps-title" className="text-sm font-medium text-fg">
            Autoriser la position
          </p>
          <p className="mt-1 text-xs text-muted">
            Le mode GPS centre la carte sur vous et vous suit. Le navigateur affichera sa propre demande d'autorisation.
          </p>
          {gps === "denied" && (
            <p className="mt-2 text-xs text-fg">Accès refusé. Autorisez la localisation pour ce site dans le navigateur, puis réessayez.</p>
          )}
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={allowGps} className="h-10 flex-1 rounded-lg bg-accent text-sm font-medium text-accent-fg">
              Autoriser
            </button>
            <button type="button" onClick={cancelGpsAsk} className="h-10 flex-1 rounded-lg border border-line text-sm text-fg">
              Plus tard
            </button>
          </div>
        </div>
      )}

      {gps === "live" && (
        <p className="gps-live absolute z-30 rounded-full border border-line bg-surface px-3 py-1 text-xs text-fg tabular-nums">
          {gpsFollow ? "GPS" : "GPS en pause"}
          {accuracy != null ? ` · ±${accuracy} m` : ""}
        </p>
      )}

      {step && (
        <div className="guide-card shadow-panel absolute z-30 rounded-2xl border border-line bg-surface px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-subtle tabular-nums">
              Étape {guideIndex + 1} / {route?.steps.length ?? 0}
            </p>
            <button type="button" aria-label="Quitter le guidage" onClick={stopGuide} className="grid size-8 place-items-center text-muted">
              <X className="size-4" strokeWidth={1.75} />
            </button>
          </div>
          <p className="mt-1 text-sm text-fg">{step.instruction}</p>
          <p className="mt-1 text-xs text-muted tabular-nums">{formatDistance(step.distance)}</p>
          <button type="button" onClick={() => void announceCurrent()} className="mt-2 text-xs font-medium text-ink">
            {voiceStatus === "loading" ? "La voix se prépare…" : voiceStatus === "speaking" ? "La voix parle" : "Réécouter la direction"}
          </button>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => moveGuide(-1)} className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-line text-sm text-fg">
              <ChevronLeft className="size-4" />
              Avant
            </button>
            <button type="button" onClick={() => moveGuide(1)} className="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-accent text-sm text-accent-fg">
              Après
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {(measuring || measure.length > 1) && (
        <div className="measure-card absolute z-20 rounded-2xl border border-line bg-surface px-4 py-3 shadow-panel">
          <p className="text-xs text-subtle">{measuring ? "Touchez la carte" : "Mesure"}</p>
          <p className="mt-1 text-lg font-medium tabular-nums text-fg">{measure.length > 1 ? formatDistance(meters) : "0 m"}</p>
          {measure.length > 1 && (
            <p className="text-xs text-muted tabular-nums">
              {formatDuration(pace("walking", meters))} à pied · {formatDuration(pace("cycling", meters))} à vélo
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={undoMeasure} className="h-9 rounded-lg border border-line px-3 text-xs text-fg">
              Annuler
            </button>
            <button type="button" onClick={clearMeasure} className="h-9 rounded-lg border border-line px-3 text-xs text-fg">
              Effacer
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function IconButton({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cx(
        "icon-btn grid size-11 place-items-center rounded-xl border shadow-panel",
        pressed ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface text-fg",
      )}
    >
      {children}
    </button>
  );
}
