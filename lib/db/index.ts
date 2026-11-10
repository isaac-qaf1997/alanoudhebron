import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDb = globalThis as unknown as { pool?: Pool }

const connectionString = process.env.DATABASE_URL_PRODUCTION ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL_PRODUCTION or DATABASE_URL must be configured')
}

export const pool = globalForDb.pool ?? new Pool({
  connectionString,
  max: 3,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
  allowExitOnIdle: true,
})

// Reuse warm-instance connections in both development and serverless runtimes.
globalForDb.pool = pool

export const db = drizzle(pool, { schema })
