/// <reference types="node" />
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres.stewimbbgkfhzjyooxhw:atg8NRU5y52SKaZY@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
  },
});