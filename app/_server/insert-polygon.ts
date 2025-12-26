"use server";

import { db } from "@/db";
import { polygon } from "@/db/schema";

export async function insertPolygon(wktString: string) {
  await db.insert(polygon).values({
    name: crypto.randomUUID(),
    geometry: wktString,
  });
}
