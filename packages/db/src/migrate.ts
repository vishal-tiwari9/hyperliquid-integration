import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = "postgresql://postgres.stewimbbgkfhzjyooxhw:atg8NRU5y52SKaZY@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

async function main() {
  // max: 1 ensures a single, secure session connection that won't drop mid-migration
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  console.log("⏳ Running migrations...");
  await migrate(db, { migrationsFolder: "./migrations" });
  console.log("✅ Migrations applied successfully!");

  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});