import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

/**
 * Retrieve and sanitize the DATABASE_URL environment variable.
 *
 * @returns The DATABASE_URL string with surrounding single or double quotes removed.
 * @throws Error if DATABASE_URL is not set or is empty.
 */
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

/**
 * Lazily initializes the Drizzle database client backed by a Neon HTTP client and returns it for reuse.
 *
 * @returns The initialized Drizzle client instance
 */
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