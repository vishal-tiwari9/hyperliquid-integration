import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!|| "postgresql://postgres.stewimbbgkfhzjyooxhw:atg8NRU5y52SKaZY@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
export * from "./schema";