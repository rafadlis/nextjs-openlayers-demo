# Next.js OpenLayers + Turf.js GIS CRUD Demo

Modern geospatial demo built with Next.js (React + TypeScript), showcasing OpenLayers for interactive mapping and Turf.js for geospatial analysis. The focus is end‑to‑end CRUD operations on GIS data: create polygons, read/select features, update/modify geometry, delete features, measure area/length, split polygons, merge polygons, and more.

Keywords: OpenLayers, Next.js, React, Turf.js, GIS, Geospatial, CRUD, Polygon, Split, Merge, Measure, PostGIS, Drizzle ORM, TanStack Query, TanStack Form, Server Actions, TypeScript.

## Getting Started

Run the development server:

```bash
# install dependencies
pnpm install

# start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.  
Edit `app/page.tsx` to start; the page auto‑updates as you edit the file.

## Core Focus: GIS CRUD + Editing

- Create polygon features on an OpenLayers map
- Read/select existing features
- Update geometry: move vertices, reshape, transform
- Delete features
- Measure polygon area and perimeter/length using Turf.js
- Split polygons by drawing cut lines or geometries
- Merge/union polygons into a single feature

## Tech Stack

- Next.js (React, App Router, TypeScript)
- OpenLayers for map rendering and feature editing
- Turf.js for geospatial calculations and topology

## Roadmap (Next Updates)

Planned enhancements to make this a fuller, production‑ready GIS demo:

- TanStack Query for data fetching, caching, and mutations
- Next.js Server Actions for type‑safe server workflows
- TanStack Form for form state and validation
- PostGIS for spatial storage (PostgreSQL with GIS extensions)
- Drizzle ORM for database operations with a custom PostGIS‑aware schema
- End‑to‑end type safety across UI, server, and database (no `any`)

## Useful Scripts

```bash
# run dev server
pnpm dev

# build for production
pnpm build

# start production server
pnpm start
```

## Why OpenLayers + Turf.js + Next.js?

- OpenLayers provides robust vector editing, interactions, and projection support
- Turf.js offers fast, composable geospatial operations (measure, buffer, union, split, etc.)
- Next.js delivers a great developer experience and a simple deployment story

## Learn More

- [Next.js Documentation](https://nextjs.org/docs) – features and API
- [Learn Next.js](https://nextjs.org/learn) – interactive tutorial
- [OpenLayers](https://openlayers.org/) – mapping and vector tools
- [Turf.js](https://turfjs.org/) – geospatial analysis
- [PostGIS](https://postgis.net/) – spatial database
- [Drizzle ORM](https://orm.drizzle.team/) – type‑safe ORM
- [TanStack Query](https://tanstack.com/query/latest) – data fetching and caching
- [TanStack Form](https://tanstack.com/form/latest) – form state and validation

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the official [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
