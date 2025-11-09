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
import { Minus, MousePointer, Pencil, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

export default function MapComponent() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<OlMap | null>(null);

  const handleZoomIn = (): void => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }
    const view = map.getView();
    const currentZoom = view.getZoom() ?? 0;
    view.setZoom(currentZoom + 1);
  };

  const handleZoomOut = (): void => {
    const map = mapInstanceRef.current;
    if (!map) {
      return;
    }
    const view = map.getView();
    const currentZoom = view.getZoom() ?? 0;
    view.setZoom(currentZoom - 1);
  };

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
    mapInstanceRef.current = map;
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
      mapInstanceRef.current = null;
    };
  }, []);
  return (
    <div className="relative">
      <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />
      <div className="absolute top-4 right-4">
        <ButtonGroup orientation="vertical">
          <Button aria-label="Zoom in" onClick={handleZoomIn} variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            aria-label="Zoom out"
            onClick={handleZoomOut}
            variant="outline"
          >
            <Minus className="h-4 w-4" />
          </Button>
        </ButtonGroup>
      </div>
      <div className="-translate-x-1/2 absolute bottom-4 left-1/2">
        <ButtonGroup>
          <Button aria-label="Edit mode" variant="outline">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button aria-label="Select mode" variant="outline">
            <MousePointer className="h-4 w-4" />
          </Button>
          <Button aria-label="Modify mode" variant="outline">
            <Settings2 className="h-4 w-4" />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
