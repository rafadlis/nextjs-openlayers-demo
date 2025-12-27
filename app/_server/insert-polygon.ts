"use server";

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { polygon } from "@/db/schema";

/**
 * Insert a polygon specified as a WKT string into the polygon table and return the new row's id.
 *
 * @param wktString - Well-known text (WKT) representation of the polygon geometry; stored with SRID 4326
 * @returns An object with `success` set to `true` and `id` containing the inserted row's id
 */
export async function insertPolygon(wktString: string) {
  const result =await db.insert(polygon).values({
    name: crypto.randomUUID(),
    geometry: sql`ST_GeomFromText(${wktString}, 4326)`,
  }).returning({ id: polygon.id });
  return {
    success: true,
    id: result[0].id,

  };
}