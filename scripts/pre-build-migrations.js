#!/usr/bin/env node
/**
 * Pre-build script to handle Prisma migrations safely
 * This runs before the main build and resolves any failed migrations
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const KNOWN_FAILED_MIGRATIONS = [
    '20231007173937_settlement_work_v3' // Migration that doesn't exist in current codebase
];

async function checkMigrationStatus() {
    console.log('📋 Checking migration status...');
    try {
        const { stdout, stderr } = await execAsync('npx prisma migrate status');
        console.log(stdout);
        return stdout;
    } catch (error) {
        // migrate status exits with code 1 if there are issues
        console.warn('⚠️  Migration status check found issues');
        return error.stdout || '';
    }
}

async function resolveFailedMigration(migrationName) {
    console.log(`🔧 Resolving failed migration: ${migrationName}`);
    try {
        const { stdout } = await execAsync(
            `npx prisma migrate resolve --rolled-back ${migrationName}`
        );
        console.log(stdout);
        console.log('✅ Migration resolved');
        return true;
    } catch (error) {
        console.error('❌ Failed to resolve migration:', error.message);
        return false;
    }
}

async function deployMigrations() {
    console.log('🚀 Deploying migrations...');
    try {
        const { stdout } = await execAsync('npx prisma migrate deploy');
        console.log(stdout);
        console.log('✅ Migrations deployed');
        return true;
    } catch (error) {
        console.error('❌ Migration deployment failed:', error.message);
        throw error;
    }
}

async function main() {
    console.log('🏗️  Pre-build: Prisma Migration Check');
    console.log('=====================================\n');

    try {
        // Step 1: Check migration status
        const status = await checkMigrationStatus();

        // Step 2: Check for known failed migrations
        let hasFailedMigrations = false;
        for (const migration of KNOWN_FAILED_MIGRATIONS) {
            if (status.includes(migration) && status.includes('failed')) {
                console.log(`\n⚠️  Found known failed migration: ${migration}`);
                hasFailedMigrations = true;
                
                const resolved = await resolveFailedMigration(migration);
                if (!resolved) {
                    console.error('❌ Could not resolve migration automatically');
                    console.error('Manual intervention required.');
                    console.error('See: docs/migration/PRODUCTION_MIGRATION_FIX.md');
                    process.exit(1);
                }
            }
        }

        if (hasFailedMigrations) {
            console.log('\n📋 Rechecking migration status...');
            await checkMigrationStatus();
        }

        // Step 3: Deploy current migrations
        console.log('');
        await deployMigrations();

        console.log('\n✅ Pre-build migration check completed successfully!\n');
        process.exit(0);

    } catch (error) {
        console.error('\n❌ Pre-build migration check failed!');
        console.error(error.message);
        console.error('\nFor help, see: docs/migration/PRODUCTION_MIGRATION_FIX.md');
        process.exit(1);
    }
}

main();
