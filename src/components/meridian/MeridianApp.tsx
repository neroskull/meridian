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
    <main className="site">
      <MapView />
      <Controls />
      <Dock />
    </main>
  );
}
