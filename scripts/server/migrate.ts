import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Available environment variables:', Object.keys(process.env).join(', '));
  throw new Error('DATABASE_URL environment variable is not set');
}

console.log('🚀 Running database migrations...');
console.log('📊 Database URL:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Hide password

// Create a postgres connection for migrations
const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });

try {
  // Test connection first
  console.log('🔌 Testing database connection...');
  await migrationClient`SELECT 1`;
  console.log('✅ Database connection successful');

  // Create drizzle instance for migrations
  const db = drizzle(migrationClient);

  // Run migrations
  console.log('📦 Running migrations from ./drizzle folder...');
  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('✅ Migrations completed successfully');
} catch (error) {
  console.error('❌ Migration failed:', error);
  if (error instanceof Error) {
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
  process.exit(1);
} finally {
  // Close the connection
  console.log('🔌 Closing database connection...');
  await migrationClient.end();
  console.log('✅ Database connection closed');
}
