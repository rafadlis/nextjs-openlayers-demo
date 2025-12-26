"use server";

import { asc, sql } from "drizzle-orm";
import { db } from "@/db";
import { polygon } from "@/db/schema";

export async function getPolygons() {
  console.log("starting to get polygons");
  const polygons = await db
    .select({
      id: polygon.id,
      name: polygon.name,
      wkt: sql<string>`ST_AsText(${polygon.geometry})`,
    })
    .from(polygon)
    .orderBy(asc(polygon.id));
  console.log(polygons);
  return polygons;
}
