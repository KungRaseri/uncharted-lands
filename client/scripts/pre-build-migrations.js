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
        if (stderr) console.log(stderr);
        return { output: stdout + '\n' + stderr, hasError: false };
    } catch (error) {
        // migrate status exits with code 1 if there are issues
        console.warn('⚠️  Migration status check found issues');
        // Combine stdout and stderr as the error message might be in either
        const output = (error.stdout || '') + '\n' + (error.stderr || '');
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
        return { success: true, error: null };
    } catch (error) {
        console.error('❌ Migration deployment failed:', error.message);
        const output = (error.stdout || '') + '\n' + (error.stderr || '') + '\n' + error.message;
        return { success: false, error: output };
    }
}

async function main() {
    console.log('🏗️  Pre-build: Prisma Migration Check');
    console.log('=====================================\n');

    try {
        // Step 1: Check migration status
        const statusResult = await checkMigrationStatus();
        
        // Step 2: Try to deploy migrations
        console.log('');
        const deployResult = await deployMigrations();
        
        // Step 3: If deployment failed, check for known failed migrations
        if (!deployResult.success) {
            console.log('\n⚠️  Deployment failed, checking for known failed migrations...\n');
            
            let resolved = false;
            
            for (const migration of KNOWN_FAILED_MIGRATIONS) {
                // Check if this migration is mentioned in the error
                if (deployResult.error.includes(migration)) {
                    console.log(`⚠️  Found known failed migration: ${migration}`);
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
                    
                    // Try deploying again after resolving
                    console.log('\n🔄 Retrying migration deployment...\n');
                    const retryResult = await deployMigrations();
                    
                    if (!retryResult.success) {
                        console.error('❌ Migration deployment still failing after resolution');
                        console.error(retryResult.error);
                        console.error('\nManual intervention required.');
                        console.error('See: docs/migration/PRODUCTION_MIGRATION_FIX.md');
                        process.exit(1);
                    }
                    
                    break; // Only resolve one migration at a time
                }
            }
            
            if (!resolved) {
                console.error('❌ Deployment failed with an unknown error');
                console.error(deployResult.error);
                console.error('\nManual intervention required.');
                console.error('See: docs/migration/PRODUCTION_MIGRATION_FIX.md');
                process.exit(1);
            }
        }

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
