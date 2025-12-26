"use client";

import WKT from "ol/format/WKT";
import { Draw, Modify, Select, Snap } from "ol/interaction";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OlMap from "ol/Map";
import { fromLonLat } from "ol/proj";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import View from "ol/View";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import "ol/ol.css";
import { useQuery } from "@tanstack/react-query";
import { Minus, MousePointer, Pencil, Plus, Settings2 } from "lucide-react";
import Feature from "ol/Feature";
import { getArea } from "ol/sphere";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Kbd } from "@/components/ui/kbd";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getPolygons } from "../_lib/get-polygons";

export default function MapComponent() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<OlMap | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);
  const selectInteractionRef = useRef<Select | null>(null);
  const snapInteractionRef = useRef<Snap | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);

  type EditorMode = "draw" | "select" | "modify";
  const [mode, setMode] = useState<EditorMode>("draw");
  const [showedData, setShowedData] = useState<
    | {
        type: string;
        areaInMeterSquare: number;
      }
    | undefined
  >(undefined);
  const [crs, setCrs] = useState<string | undefined>(undefined);

  const applyMode = useEffectEvent((nextMode: EditorMode): void => {
    const draw = drawInteractionRef.current;
    const modify = modifyInteractionRef.current;
    const select = selectInteractionRef.current;
    const snap = snapInteractionRef.current;

    select?.clearSelection();

    if (draw) {
      // Abort any in-progress sketch when leaving edit (draw) mode
      if (nextMode !== "draw") {
        try {
          draw.abortDrawing();
        } catch {
          // no-op if not drawing
        }
      }
      draw.setActive(nextMode === "draw");
    }
    if (modify) {
      modify.setActive(nextMode === "modify");
    }
    if (select) {
      select.setActive(nextMode === "select");
    }
    if (snap) {
      // Snap is useful for drawing and modifying; disable for pure selection
      snap.setActive(nextMode !== "select");
    }
  });
  const onKeyDown = useEffectEvent((event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    // Abort drawing on Escape/Esc
    if (key.startsWith("esc")) {
      try {
        drawInteractionRef.current?.abortDrawing();
      } catch {
        // ignore if not drawing
      }
      return;
    }
    // Undo last point on Ctrl/Cmd + Z
    const hasShortcutModifier = event.ctrlKey || event.metaKey;
    if (hasShortcutModifier && key === "z") {
      event.preventDefault();
      drawInteractionRef.current?.removeLastPoint();
      return;
    }
    // Mode switching via single-key shortcuts
    const modeByKey: Record<string, EditorMode> = {
      d: "draw",
      s: "select",
      m: "modify",
    };
    const nextMode = modeByKey[key];
    if (nextMode) {
      event.preventDefault();
      setMode(nextMode);
    }
  });

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

  const { data: polygonsData } = useQuery({
    queryKey: ["polygons"],
    queryFn: () => getPolygons(),
  });

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    const baseLayer = new TileLayer({
      source: new OSM(),
    });
    const drawSource = new VectorSource();
    vectorSourceRef.current = drawSource;
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
    const selectInteraction = new Select();
    const snapInteraction = new Snap({ source: drawSource });

    map.addInteraction(modifyInteraction);
    map.addInteraction(drawInteraction);
    map.addInteraction(selectInteraction);
    map.addInteraction(snapInteraction);

    selectInteraction.on("select", (evt): void => {
      if (!evt.selected.length) {
        setShowedData(undefined);
        return;
      }
      const data = evt.selected[0];
      const dataGeometry = data.getGeometry();

      if (!dataGeometry) {
        setShowedData(undefined);
        return;
      }
      const areaInMeterSquare = getArea(dataGeometry);
      setShowedData({
        type: dataGeometry.getType(),
        areaInMeterSquare,
      });
    });

    drawInteraction.on("drawend", (evt): void => {
      const geometry = evt.feature.getGeometry();
      if (geometry) {
        const format = new WKT();
        const wktString = format.writeGeometry(geometry, {
          dataProjection: "EPSG:3857",
          featureProjection: "EPSG:4326",
        });
        console.log(wktString);
      }
    });

    // Save to refs for external control
    modifyInteractionRef.current = modifyInteraction;
    drawInteractionRef.current = drawInteraction;
    selectInteractionRef.current = selectInteraction;
    snapInteractionRef.current = snapInteraction;

    // Initialize with default mode 'edit' without referencing state/deps
    drawInteraction.setActive(true);
    modifyInteraction.setActive(false);
    selectInteraction.setActive(false);
    snapInteraction.setActive(true);

    window.addEventListener("keydown", onKeyDown);

    setCrs(map.getView().getProjection().getCode());

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      map.setTarget(undefined);
      mapInstanceRef.current = null;
      drawInteractionRef.current = null;
      modifyInteractionRef.current = null;
      selectInteractionRef.current = null;
      snapInteractionRef.current = null;
    };
  }, []);

  useEffect(() => {
    const source = vectorSourceRef.current;

    // Guard clause: if map isn't ready or no data, do nothing
    if (!(source && polygonsData)) {
      return;
    }

    // 1. Clear existing features to avoid duplicates
    source.clear();

    // 2. Parse WKT and Transform Projections
    const format = new WKT();

    const features = polygonsData.map((item) => {
      // Assuming item.geometry is the WKT string: "POLYGON((...))"
      const geometry = format.readGeometry(item.wkt, {
        dataProjection: "EPSG:4326", // COMING FROM: Database (Lat/Lon)
        featureProjection: "EPSG:3857", // GOING TO: Map View (Meters)
      });

      const feature = new Feature({
        geometry,
      });

      // Optional: Store ID so you can identify it later (e.g., for selection)
      feature.setId(item.id);

      return feature;
    });

    // 3. Add new features to the source
    if (features.length > 0) {
      source.addFeatures(features);
    }
  }, [polygonsData]);

  // React to mode changes
  useEffect(() => {
    applyMode(mode);
  }, [mode]);
  return (
    <div className="relative">
      <div ref={mapRef} style={{ width: "100%", height: "100vh" }} />
      <div className="absolute top-4 right-4">
        <ButtonGroup className="shadow-2xl" orientation="vertical">
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
      <div className="-translate-y-1/2 absolute top-1/2 left-4 shadow-2xl">
        <Card
          className={cn("overflow-hidden", showedData ? "block" : "hidden")}
        >
          <CardHeader>
            <CardTitle>Selected Polygon</CardTitle>
            <CardDescription>
              The details of the selected polygon will be displayed here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="text-muted-foreground">Type</TableCell>
                  <TableCell>{showedData?.type ?? "-"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-muted-foreground">
                    Area{" "}
                    <span className="text-muted-foreground">
                      (m<sup>2</sup>)
                    </span>
                  </TableCell>
                  <TableCell>
                    {showedData?.areaInMeterSquare.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) ?? "-"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="-translate-x-1/2 absolute bottom-4 left-1/2">
        <ButtonGroup className="shadow-2xl">
          <Tooltip>
            <Button
              aria-label="Edit mode"
              asChild
              onClick={(): void => setMode("draw")}
              variant={mode === "draw" ? "default" : "outline"}
            >
              <TooltipTrigger>
                <Pencil className="h-4 w-4" />
              </TooltipTrigger>
            </Button>
            <TooltipContent>
              <p>
                Draw <Kbd>e</Kbd>
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <Button
              aria-label="Select mode"
              asChild
              onClick={(): void => setMode("select")}
              variant={mode === "select" ? "default" : "outline"}
            >
              <TooltipTrigger>
                <MousePointer className="h-4 w-4" />
              </TooltipTrigger>
            </Button>
            <TooltipContent>
              <p>
                Select <Kbd>s</Kbd>
              </p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <Button
              aria-label="Modify mode"
              asChild
              onClick={(): void => setMode("modify")}
              variant={mode === "modify" ? "default" : "outline"}
            >
              <TooltipTrigger>
                <Settings2 className="h-4 w-4" />
              </TooltipTrigger>
            </Button>
            <TooltipContent>
              <p>
                Modify <Kbd>m</Kbd>
              </p>
            </TooltipContent>
          </Tooltip>
        </ButtonGroup>
      </div>
      <div className="absolute bottom-4 left-4">
        <Badge>{crs}</Badge>
      </div>
    </div>
  );
}
