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
        return { output: stdout, hasError: false };
    } catch (error) {
        // migrate status exits with code 1 if there are issues
        console.warn('⚠️  Migration status check found issues');
        const output = error.stdout || error.stderr || '';
        console.log(output);
        return { output, hasError: true };
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
        const statusResult = await checkMigrationStatus();
        
        // Step 2: If there's an error, check for known failed migrations
        if (statusResult.hasError) {
            let resolved = false;
            
            for (const migration of KNOWN_FAILED_MIGRATIONS) {
                // Check if this migration is mentioned in the error
                if (statusResult.output.includes(migration)) {
                    console.log(`\n⚠️  Found known failed migration: ${migration}`);
                    console.log('This migration does not exist in the current codebase.');
                    console.log('Marking it as rolled back to allow new migrations...\n');
                    
                    const success = await resolveFailedMigration(migration);
                    if (!success) {
                        console.error('❌ Could not resolve migration automatically');
                        console.error('Manual intervention required.');
                        console.error('See: docs/migration/PRODUCTION_MIGRATION_FIX.md');
                        process.exit(1);
                    }
                    
                    resolved = true;
                    break; // Only resolve one migration at a time
                }
            }
            
            if (!resolved) {
                console.error('❌ Found failed migrations that are not in the known list');
                console.error('Manual intervention required.');
                console.error('See: docs/migration/PRODUCTION_MIGRATION_FIX.md');
                process.exit(1);
            }
            
            // Recheck status after resolving
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
