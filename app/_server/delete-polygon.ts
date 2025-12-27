"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { polygon } from "@/db/schema";

/**
 * Delete a polygon record by its numeric ID.
 *
 * @param id - The polygon record's primary key ID to delete
 * @returns An object with `success` and `rowCount`: `success` is `true` if one or more rows were deleted, `false` otherwise; `rowCount` is the number of rows affected
 */
export async function deletePolygonById(id: number) {
  const result = await db.delete(polygon).where(eq(polygon.id, id));
  return {
    success: result.rowCount > 0,
    rowCount: result.rowCount,
  };
}