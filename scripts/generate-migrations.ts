import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { neon } from '@neondatabase/serverless';
import * as schema from "../db/schema";

// We only need one database to generate migrations
const sql = neon(process.env.DATABASE_REGION_A!);
const db = drizzle(sql, { schema });

async function main() {
  try {
    console.log("🔄 Generating migrations...");
    await migrate(db, { migrationsFolder: "db/migrations" });
    console.log("✅ Migrations generated successfully!");
  } catch (error) {
    console.error("❌ Error generating migrations:", error);
    process.exit(1);
  }
}

main(); 