import { pool } from './db'
import fs from 'fs'
import path from 'path'

export async function runMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name    text PRIMARY KEY,
      run_at  timestamptz NOT NULL DEFAULT now()
    )
  `)

  const dir = path.join(__dirname, '../migrations')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()

  for (const file of files) {
    const { rows } = await pool.query(
      'SELECT 1 FROM _migrations WHERE name = $1',
      [file]
    )
    if (rows.length > 0) continue

    const sql = fs.readFileSync(path.join(dir, file), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
    console.log(`Migration applied: ${file}`)
  }
}
