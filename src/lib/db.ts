import "server-only";

import postgres, { type Sql } from "postgres";

let client: Sql | undefined;

export function getDb(): Sql {
  if (client) {
    return client;
  }

  const connectionString = process.env.DATABASE_URL_POOLED?.trim();

  if (!connectionString) {
    throw new Error("DATABASE_URL_POOLED is not configured.");
  }

  client = postgres(connectionString, {
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: "require",
  });

  return client;
}
