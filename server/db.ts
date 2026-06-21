import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

let db: ReturnType<typeof drizzle> | null = null;
let pool: InstanceType<typeof Pool> | null = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
  });
  db = drizzle(pool, { schema });
} else {
  console.warn(
    "\x1b[33m⚠ WARNING: DATABASE_URL is not set. Database features will be unavailable.\x1b[0m"
  );
}

export { pool, db };
