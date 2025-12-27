"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { polygon } from "@/db/schema";

export async function deletePolygonById(id: number) {
  const result = await db.delete(polygon).where(eq(polygon.id, id));
  return {
    success: result.rowCount > 0,
    rowCount: result.rowCount,
  };
}
