"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { polygon } from "@/db/schema";

export async function deletePolygonById(id: number) {
  await db.delete(polygon).where(eq(polygon.id, id));
}
