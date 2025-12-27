"use server";

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { polygon } from "@/db/schema";

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
