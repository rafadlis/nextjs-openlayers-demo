"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { polygon } from "@/db/schema";

export async function updatePolygonById(data: { id: number; wkt: string }[]) {
  const queries = data.map((item) =>
    db
      .update(polygon)
      .set({
        geometry: sql`ST_GeomFromText(${item.wkt}, 4326)`,
      })
      .where(eq(polygon.id, item.id))
  );

  const [firstQuery, ...restQueries] = queries;

  if (!firstQuery) {
    return [];
  }

  const batchResponse = await db.batch([firstQuery, ...restQueries]);

  return batchResponse.map((result) => ({
    rowCount: result.rowCount,
  }));
}
