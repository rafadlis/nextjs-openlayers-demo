"use client";

import WKT from "ol/format/WKT";
import { Draw, Modify, Select, Snap } from "ol/interaction";
import type { ModifyEvent } from "ol/interaction/Modify";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import OlMap from "ol/Map";
import { fromLonLat } from "ol/proj";
import OSM from "ol/source/OSM";
import VectorSource from "ol/source/Vector";
import View from "ol/View";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import "ol/ol.css";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Minus,
  MousePointer,
  Pencil,
  Plus,
  RefreshCcw,
  Ruler,
  Settings2,
} from "lucide-react";
import Feature from "ol/Feature";
import type { DrawEvent } from "ol/interaction/Draw";
import { getArea } from "ol/sphere";
import CircleStyle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import Style from "ol/style/Style";
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
import { deletePolygonById } from "../_server/delete-polygon";
import { insertPolygon } from "../_server/insert-polygon";
import { updatePolygonById } from "../_server/update-polygon";

export default function MapComponent() {
  // MARK: ref
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<OlMap | null>(null);
  const drawInteractionRef = useRef<Draw | null>(null);
  const modifyInteractionRef = useRef<Modify | null>(null);
  const selectInteractionRef = useRef<Select | null>(null);
  const snapInteractionRef = useRef<Snap | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);

  const rulerDrawInteractionRef = useRef<Draw | null>(null);
  const rulerSnapInteractionRef = useRef<Snap | null>(null);
  const rulerSourceRef = useRef<VectorSource | null>(null);

  // MARK: query
  const queryClient = useQueryClient();

  const { mutate: savePolygon } = useMutation({
    mutationFn: (wkt: string) => insertPolygon(wkt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polygons"] });
    },
    onError: (error) => {
      console.error("Failed to save polygon:", error);
    },
  });
  const { mutate: updatePolygon } = useMutation({
    mutationFn: (data: { id: number; wkt: string }[]) =>
      updatePolygonById(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polygons"] });
    },
    onError: (error) => {
      console.error("Failed to update polygon:", error);
    },
  });
  const { mutate: deletePolygon } = useMutation({
    mutationFn: (id: number) => deletePolygonById(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polygons"] });
      // Clear selection and UI data on success
      selectInteractionRef.current?.getFeatures().clear();
      setShowedData(undefined);
    },
    onError: (error) => {
      console.error("Failed to delete polygon:", error);
    },
  });

  const onModifyEnd = useEffectEvent((evt: ModifyEvent) => {
    const data: { id: number; wkt: string }[] = [];
    for (const feature of evt.features.getArray()) {
      const id = feature.getId()
      const geometry = feature.getGeometry();
      if (!geometry || id === undefined) {
        continue;
      }
      const format = new WKT();
      const wktString = format.writeGeometry(geometry, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });
      data.push({ id: Number(id), wkt: wktString });
    }
    updatePolygon(data);
  });
  const { data: polygonsData, refetch: refetchPolygons } = useQuery({
    queryKey: ["polygons"],
    queryFn: () => getPolygons(),
  });

  const onDrawEnd = useEffectEvent((evt: DrawEvent) => {
    const geometry = evt.feature.getGeometry();
    if (geometry) {
      const format = new WKT();
      const wktString = format.writeGeometry(geometry, {
        // 1. Where the data is GOING (Database) -> We want Lat/Lon (4326)
        dataProjection: "EPSG:4326",

        // 2. Where the data is COMING FROM (Map) -> We have Meters (3857)
        featureProjection: "EPSG:3857",
      });
      savePolygon(wktString);
      setTimeout(() => {
        vectorSourceRef.current?.removeFeature(evt.feature);
      }, 0);
    }
  });

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This is a complex function that needs to be refactored.
  const handleDelete = useEffectEvent(() => {
    const select = selectInteractionRef.current;
    if (!select) {
      return;
    }

    const selectedFeatures = select.getFeatures();

    // Iterate backward so removing items doesn't mess up the loop
    for (const feature of selectedFeatures.getArray().slice()) {
      // CASE A: It is a Ruler (Local only)
      if (rulerSourceRef.current?.hasFeature(feature)) {
        rulerSourceRef.current.removeFeature(feature);
        selectedFeatures.remove(feature); // Deselect
      }

      // CASE B: It is a Polygon (Database)
      else if (vectorSourceRef.current?.hasFeature(feature)) {
        const id = feature.getId();
        if (id) {
          // Trigger server delete
          deletePolygon(Number(id));
        } else {
          // Fallback for unsaved features
          vectorSourceRef.current.removeFeature(feature);
          selectedFeatures.remove(feature);
        }
      }
    }

    // Hide the info card if nothing is selected anymore
    if (selectedFeatures.getLength() === 0) {
      setShowedData(undefined);
    }
  });

  // MARK: utilty
  type EditorMode = "draw" | "select" | "modify" | "ruler";
  const [mode, setMode] = useState<EditorMode>("draw");
  const [showedData, setShowedData] = useState<
    | {
        id: number;
        type: string;
        areaInMeterSquare: number;
      }
    | undefined
  >(undefined);
  const [crs, setCrs] = useState<string | undefined>(undefined);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This is a complex function that needs to be refactored.
  const applyMode = useEffectEvent((nextMode: EditorMode): void => {
    const draw = drawInteractionRef.current;
    const modify = modifyInteractionRef.current;
    const select = selectInteractionRef.current;
    const snap = snapInteractionRef.current;

    const rulerDraw = rulerDrawInteractionRef.current;
    const rulerSnap = rulerSnapInteractionRef.current;

    select?.clearSelection();

    if (draw) {
      if (nextMode !== "draw") {
        try {
          draw.abortDrawing();
        } catch {
          // no-op if not drawing
        }
      }
      draw.setActive(nextMode === "draw");
    }
    if (rulerDraw) {
      if (nextMode !== "ruler") {
        try {
          rulerDraw.abortDrawing();
        } catch {
          // no-op if not drawing
        }
      }
      rulerDraw.setActive(nextMode === "ruler");
    }
    if (modify) {
      modify.setActive(nextMode === "modify");
    }
    if (select) {
      select.setActive(nextMode === "select");
    }
    if (snap && rulerSnap) {
      // Snap is useful for drawing and modifying; disable for pure selection
      const isEditing =
        nextMode === "draw" || nextMode === "modify" || nextMode === "ruler";
      snap.setActive(isEditing);
      rulerSnap.setActive(isEditing);
    }
  });
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This is a complex function that needs to be refactored.
  const onKeyDown = useEffectEvent((event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    if (key === "delete" || key === "backspace") {
      // Prevent browser back navigation if focus is on body
      if (document.activeElement === document.body) {
        event.preventDefault();
      }
      handleDelete();
      return;
    }
    // Abort drawing on Escape/Esc
    if (key.startsWith("esc")) {
      try {
        drawInteractionRef.current?.abortDrawing();
        rulerDrawInteractionRef.current?.abortDrawing();
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
      r: "ruler",
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

  // MARK: main
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

    const rulerStyle = new Style({
      stroke: new Stroke({
        color: "#f97316", // Orange-500
        width: 2,
        lineDash: [10, 10], // Dashed line
      }),
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({ color: "#f97316" }),
      }),
    });

    const rulerSource = new VectorSource();
    rulerSourceRef.current = rulerSource;
    const rulerLayer = new VectorLayer({
      source: rulerSource,
      style: rulerStyle,
    });
    const map = new OlMap({
      layers: [baseLayer, drawLayer, rulerLayer],
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

    const rulerDrawInteraction = new Draw({
      type: "LineString",
      source: rulerSource,
    });
    const rulerSnapInteraction = new Snap({ source: rulerSource });

    map.addInteraction(modifyInteraction);
    map.addInteraction(drawInteraction);
    map.addInteraction(rulerDrawInteraction);

    map.addInteraction(selectInteraction);

    map.addInteraction(rulerSnapInteraction);
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
        id: data.getId() as number,
        type: dataGeometry.getType(),
        areaInMeterSquare,
      });
    });

    drawInteraction.on("drawend", onDrawEnd);
    modifyInteraction.on("modifyend", onModifyEnd);

    // Save to refs for external control
    modifyInteractionRef.current = modifyInteraction;
    drawInteractionRef.current = drawInteraction;
    selectInteractionRef.current = selectInteraction;
    snapInteractionRef.current = snapInteraction;
    rulerDrawInteractionRef.current = rulerDrawInteraction;
    rulerSnapInteractionRef.current = rulerSnapInteraction;

    // Initialize with default mode 'edit' without referencing state/deps
    drawInteraction.setActive(true);
    modifyInteraction.setActive(false);
    selectInteraction.setActive(false);
    snapInteraction.setActive(true);
    rulerSnapInteraction.setActive(false);

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

  // MARK: new data
  useEffect(() => {
    const source = vectorSourceRef.current;

    if (!(source && polygonsData)) {
      return;
    }

    source.clear();

    const format = new WKT();

    const features = polygonsData.map((item) => {
      const geometry = format.readGeometry(item.wkt, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });

      const feature = new Feature({
        geometry,
      });

      feature.setId(item.id);

      return feature;
    });

    if (features.length > 0) {
      source.addFeatures(features);
    }
  }, [polygonsData]);

  useEffect(() => {
    applyMode(mode);
  }, [mode]);

  // MARK: return
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
                  <TableCell className="text-muted-foreground">ID</TableCell>
                  <TableCell>{showedData?.id ?? "-"}</TableCell>
                </TableRow>
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
          <ButtonGroup>
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
            <Tooltip>
              <Button
                aria-label="Ruler mode"
                asChild
                onClick={(): void => setMode("ruler")}
                variant={mode === "ruler" ? "default" : "outline"}
              >
                <TooltipTrigger>
                  <Ruler className="h-4 w-4" />
                </TooltipTrigger>
              </Button>
              <TooltipContent>
                <p>
                  Ruler <Kbd>r</Kbd>
                </p>
              </TooltipContent>
            </Tooltip>
          </ButtonGroup>
          <ButtonGroup>
            <Tooltip>
              <Button
                aria-label="Refresh polygons"
                asChild
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["polygons"] });

                  refetchPolygons();
                }}
                variant="outline"
              >
                <TooltipTrigger>
                  <RefreshCcw className="h-4 w-4" />
                </TooltipTrigger>
              </Button>
              <TooltipContent>
                <p>Refresh polygons</p>
              </TooltipContent>
            </Tooltip>
          </ButtonGroup>
        </ButtonGroup>
      </div>
      <div className="absolute bottom-4 left-4">
        <Badge>{crs}</Badge>
      </div>
    </div>
  );
}
