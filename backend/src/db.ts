import pg, { Pool } from 'pg'

// Return date and time columns as plain strings, not JS Date objects
pg.types.setTypeParser(1082, (val: string) => val) // date
pg.types.setTypeParser(1083, (val: string) => val) // time without timezone

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
