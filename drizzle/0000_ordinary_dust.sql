CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE "polygon" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"geometry" geography(POLYGON, 4326) NOT NULL
);
