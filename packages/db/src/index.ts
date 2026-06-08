// packages/db/src/index.ts
// SECURITY FIX: removed hardcoded Supabase credentials.
// Set DATABASE_URL in your .env.local (never commit credentials).

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to .env.local\n" +
    "Example: postgresql://user:pass@host:5432/dbname"
  );
}

// prepare: false is required for Supabase/pgBouncer transaction-mode pooling
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
export * from "./schema.ts";