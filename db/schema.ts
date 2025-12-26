import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { pgPolygon } from "./gis-columns";

export const polygon = pgTable("polygon", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  geometry: pgPolygon().notNull(),
});
