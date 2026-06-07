/// <reference types="node" />
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    // 💡 CHANGED PORT FROM 6543 TO 5432
    url: process.env.DATABASE_URL || "postgresql://postgres.stewimbbgkfhzjyooxhw:atg8NRU5y52SKaZY@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"
  },
});