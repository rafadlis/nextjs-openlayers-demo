import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Please ensure it's set in your .env or .env.local file and restart your dev server."
    );
  }
  // Remove quotes if present (some .env parsers include them)
  return url.replace(/^["']|["']$/g, "");
}

// Lazy initialization to ensure env vars are loaded when actually used
let _db: ReturnType<typeof drizzle<Record<string, never>>> | null = null;

function getDb() {
  if (!_db) {
    const sql = neon(getDatabaseUrl());
    _db = drizzle({ client: sql });
  }
  return _db;
}

export const db = new Proxy(
  {} as ReturnType<typeof drizzle<Record<string, never>>>,
  {
    get(_target, prop) {
      return getDb()[
        prop as keyof ReturnType<typeof drizzle<Record<string, never>>>
      ];
    },
  }
);
