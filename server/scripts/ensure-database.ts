// server/scripts/ensure-database.ts
import { Client } from 'pg';

export async function ensureDatabase() {
  const dbName = process.env.DATABASE_NAME || 'uncharted_lands_dev';
  
  // Connect to 'postgres' default database first
  const client = new Client({
    host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT) || 5432,
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD,
    database: 'postgres', // Connect to default database
  });

  await client.connect();
  
  // Check if database exists
  const result = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [dbName]
  );
  
  if (result.rowCount === 0) {
    console.log(`Creating database: ${dbName}`);
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Database created: ${dbName}`);
  } else {
    console.log(`✅ Database already exists: ${dbName}`);
  }
  
  await client.end();
}