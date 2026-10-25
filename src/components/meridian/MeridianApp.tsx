import { useEffect } from "react";
import { clockNow } from "@/lib/maps/model";
import { hydrateMeridian, useMeridian } from "@/lib/maps/store";
import { Controls } from "./Controls";
import { Dock } from "./Dock";
import { MapView } from "./MapView";

export function MeridianApp() {
  useEffect(() => {
    hydrateMeridian();
    useMeridian.setState({ departAt: clockNow() });
  }, []);

  return (
    <div className="phone-stage">
      <main className="phone">
        <div className="phone-screen">
          <MapView />
          <Controls />
          <Dock />
        </div>
        <div className="phone-island" aria-hidden />
        <div className="phone-home" aria-hidden />
      </main>
    </div>
  );
}
