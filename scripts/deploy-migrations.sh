#!/bin/bash
# Production-safe migration deployment script
# This script automatically handles failed migrations during deployment

set -e  # Exit on error

echo "🚀 Production Migration Deployment"
echo "===================================="
echo ""

# Function to check if migration exists
check_migration_status() {
    echo "📋 Checking migration status..."
    npx prisma migrate status 2>&1 | tee migration_status.txt
    
    # Check if there are failed migrations
    if grep -q "failed migrations" migration_status.txt; then
        echo "⚠️  Found failed migrations"
        return 1
    else
        echo "✅ No failed migrations found"
        return 0
    fi
}

# Function to resolve failed migration
resolve_failed_migration() {
    local migration_name="$1"
    echo "🔧 Resolving failed migration: $migration_name"
    npx prisma migrate resolve --rolled-back "$migration_name"
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration marked as rolled back"
        return 0
    else
        echo "❌ Failed to resolve migration"
        return 1
    fi
}

# Main deployment flow
echo "Step 1: Check current migration status"
if ! check_migration_status; then
    echo ""
    echo "⚠️  Failed migration detected!"
    echo "Attempting automatic resolution..."
    echo ""
    
    # Extract failed migration name from status output
    FAILED_MIGRATION=$(grep "migration started at" migration_status.txt | sed -n 's/.*`\([^`]*\)`.*/\1/p')
    
    if [ -n "$FAILED_MIGRATION" ]; then
        echo "Failed migration: $FAILED_MIGRATION"
        
        # Check if this is the known failed migration
        if [ "$FAILED_MIGRATION" = "20231007173937_settlement_work_v3" ]; then
            echo "This is a known failed migration that doesn't exist in codebase"
            echo "Marking as rolled back..."
            
            if resolve_failed_migration "$FAILED_MIGRATION"; then
                echo "✅ Failed migration resolved"
            else
                echo "❌ Could not resolve failed migration"
                echo "Manual intervention required"
                exit 1
            fi
        else
            echo "⚠️  Unknown failed migration: $FAILED_MIGRATION"
            echo "Manual intervention required"
            exit 1
        fi
    else
        echo "❌ Could not determine failed migration name"
        exit 1
    fi
fi

echo ""
echo "Step 2: Deploy current migrations"
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "✅ Migrations deployed successfully"
else
    echo "❌ Migration deployment failed"
    exit 1
fi

echo ""
echo "Step 3: Generate Prisma Client"
npx prisma generate

if [ $? -eq 0 ]; then
    echo "✅ Prisma Client generated"
else
    echo "❌ Client generation failed"
    exit 1
fi

# Clean up
rm -f migration_status.txt

echo ""
echo "=========================================="
echo "✅ Deployment completed successfully!"
echo "=========================================="
echo ""
