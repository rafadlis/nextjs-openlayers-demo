"use client";

import { Draw, Modify, Snap } from "ol/interaction";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OlMap from "ol/Map";
import { fromLonLat } from "ol/proj";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import View from "ol/View";
import { useEffect, useRef } from "react";
import "ol/ol.css";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

export default function MapComponent() {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const baseLayer = new TileLayer({
      source: new OSM(),
    });
    const drawSource = new VectorSource();
    const drawLayer = new VectorLayer({
      source: drawSource,
    });
    const map = new OlMap({
      layers: [baseLayer, drawLayer],
      controls: [],
      target: mapRef.current,
      view: new View({
        center: fromLonLat([107.887_287, -7.199_268]),
        zoom: 18,
      }),
    });
    const modifyInteraction = new Modify({ source: drawSource });
    const drawInteraction = new Draw({ type: "Polygon", source: drawSource });
    const snapInteraction = new Snap({ source: drawSource });

    map.addInteraction(modifyInteraction);
    map.addInteraction(drawInteraction);
    map.addInteraction(snapInteraction);

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape" || event.key === "Esc") {
        drawInteraction.abortDrawing();
        return;
      }

      if (event.key.toLowerCase() === "z" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        drawInteraction.removeLastPoint();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      map.setTarget(undefined);
    };
  }, []);
  return (
    <div className="relative">
      <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />
      <div className="absolute top-4 right-4">
        <ButtonGroup orientation="vertical">
          <Button variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline">
            <Minus className="h-4 w-4" />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
