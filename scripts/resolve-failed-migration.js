#!/usr/bin/env node
/**
 * Simple script to just resolve the known failed migration
 * Run this if the pre-build script doesn't work
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const FAILED_MIGRATION = '20231007173937_settlement_work_v3';

async function resolveMigration() {
    console.log('🔧 Resolving Failed Migration');
    console.log('==============================\n');
    console.log(`Migration: ${FAILED_MIGRATION}`);
    console.log('This migration does not exist in the current codebase.');
    console.log('Marking it as rolled back...\n');

    try {
        const { stdout } = await execAsync(
            `npx prisma migrate resolve --rolled-back ${FAILED_MIGRATION}`
        );
        console.log(stdout);
        console.log('✅ Migration resolved successfully!');
        console.log('\nNow you can run: npm run build');
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to resolve migration');
        console.error(error.message);
        console.error('\nTry running manually:');
        console.error(`npx prisma migrate resolve --rolled-back ${FAILED_MIGRATION}`);
        process.exit(1);
    }
}

resolveMigration();
