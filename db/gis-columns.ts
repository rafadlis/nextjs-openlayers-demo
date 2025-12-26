import { customType, timestamp } from "drizzle-orm/pg-core";

export const metaTimestamp = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

// Reusable PostGIS GEOGRAPHY POLYGON column helper with SRID 4326
export const pgPolygon = customType<{
  data: string;
}>({
  dataType: () => "geography(POLYGON, 4326)",
});

export const pgMultipolygon = customType<{ data: string }>({
  dataType: () => "geography(MULTIPOLYGON, 4326)",
});
