import { getDbConnections } from "@/db";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { neon } from '@neondatabase/serverless';

const regions = [
  {
    name: "US East",
    code: "us-east-2",
    url: process.env.DATABASE_REGION_A
  },
  {
    name: "US West",
    code: "us-west-1",
    url: process.env.DATABASE_REGION_B
  },
  {
    name: "Asia Pacific",
    code: "ap-southeast-1",
    url: process.env.DATABASE_REGION_C
  }
];

async function main() {
  console.log("🚀 Starting database initialization...");

  for (const region of regions) {
    if (!region.url) {
      console.error(`❌ Missing database URL for region ${region.name}`);
      continue;
    }

    console.log(`\n📍 Processing ${region.name} (${region.code})...`);
    
    try {
      const sql = neon(region.url);
      const db = drizzle(sql);

      console.log(`🔄 Running migrations...`);
      await migrate(db, { migrationsFolder: "db/migrations" });
      console.log(`✅ Migrations completed for ${region.name}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${region.name}:`, error);
    }
  }

  console.log("\n✨ Database initialization completed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
}); 