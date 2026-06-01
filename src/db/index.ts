// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import * as relations from "./relations";

const connectionString = process.env.DATABASE_URL!;

const globalForPostgres = globalThis as unknown as {
  postgresConnection: ReturnType<typeof postgres> | undefined;
};

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = globalForPostgres.postgresConnection ?? postgres(connectionString, {
  prepare: false,
  max: 1,
});

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresConnection = client;
}

export const db = drizzle(client, { schema: { ...schema, ...relations } });

export type DB = typeof db;
