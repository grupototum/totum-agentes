import "server-only";
import { Pool } from "pg";
import { env } from "./env";

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

export const pool: Pool =
  global.__pgPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== "production") {
  global.__pgPool = pool;
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[] }> {
  const res = await pool.query(text, params as never);
  return { rows: res.rows as T[] };
}

export async function upsertUser(input: {
  sub: string;
  email?: string | null;
  name?: string | null;
}): Promise<{ id: string; keycloak_sub: string; email: string | null; name: string | null }> {
  const { rows } = await query<{
    id: string;
    keycloak_sub: string;
    email: string | null;
    name: string | null;
  }>(
    `INSERT INTO users (keycloak_sub, email, name)
     VALUES ($1, $2, $3)
     ON CONFLICT (keycloak_sub) DO UPDATE
       SET email = EXCLUDED.email, name = EXCLUDED.name
     RETURNING id, keycloak_sub, email, name`,
    [input.sub, input.email ?? null, input.name ?? null]
  );
  return rows[0];
}
