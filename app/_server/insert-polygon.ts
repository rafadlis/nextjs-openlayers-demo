"use server";

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { polygon } from "@/db/schema";

export async function insertPolygon(wktString: string) {
  await db.insert(polygon).values({
    name: crypto.randomUUID(),
    geometry: sql`ST_GeomFromText(${wktString}, 4326)`,
  });
  return {
    success: true,
  };
}
