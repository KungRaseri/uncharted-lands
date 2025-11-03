/**
 * Seed Script Wrapper
 * 
 * This script dynamically imports and runs the TypeScript seed file.
 * It's needed because the project uses ES modules but Prisma's seed
 * command doesn't handle TypeScript ES modules well.
 */

import { pathToFileURL } from 'url';
import { register } from 'node:module';
import { resolve } from 'path';

// Register ts-node for TypeScript support
register('ts-node/esm', pathToFileURL('./'));

// Import and run the seed file
const seedPath = resolve(process.cwd(), 'prisma/seed/index.ts');
const seedUrl = pathToFileURL(seedPath).href;

console.log('🌱 Running database seed...');

import(seedUrl)
  .then(() => {
    console.log('✅ Seeding completed successfully');
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
