"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { polygon } from "@/db/schema";

export async function updatePolygonById(id: number, wktString: string) {
  await db
    .update(polygon)
    .set({
      geometry: sql`ST_GeomFromText(${wktString}, 4326)`,
    })
    .where(eq(polygon.id, id));
  return {
    success: true,
  };
}
