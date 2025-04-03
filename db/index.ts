import { drizzle } from "drizzle-orm/neon-http";
import { neon } from '@neondatabase/serverless';
import * as schema from "./schema";

// These connections should only be used in server components or server actions
export function getDbConnections() {
  const neonClientA = neon(process.env.DATABASE_REGION_A!);
  const neonClientB = neon(process.env.DATABASE_REGION_B!);
  const neonClientC = neon(process.env.DATABASE_REGION_C!);

  return {
    dbRegionA: drizzle(neonClientA, { schema }),
    dbRegionB: drizzle(neonClientB, { schema }),
    dbRegionC: drizzle(neonClientC, { schema })
  };
}

// Export schema
export * from "./schema"; 