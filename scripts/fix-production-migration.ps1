# Production Migration Fix Script
# This script helps resolve the failed migration in production

Write-Host "Production Migration Fix Utility" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your production DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Show current DATABASE_URL (masked)
$envContent = Get-Content ".env" | Where-Object { $_ -match "DATABASE_URL" }
if ($envContent) {
    $maskedUrl = $envContent -replace "(postgresql://[^:]+:)[^@]+(@.*)", '$1***$2'
    Write-Host "Current DATABASE_URL: $maskedUrl" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "⚠️  WARNING: You are about to modify the PRODUCTION database!" -ForegroundColor Yellow
Write-Host "Make sure you have:" -ForegroundColor Yellow
Write-Host "  1. Backed up the production database" -ForegroundColor Yellow
Write-Host "  2. Verified the DATABASE_URL in .env points to production" -ForegroundColor Yellow
Write-Host "  3. Tested this process in staging (if available)" -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Are you sure you want to continue? (yes/no)"
if ($confirmation -ne "yes") {
    Write-Host "Aborted." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Step 1: Checking migration status..." -ForegroundColor Cyan
npx prisma migrate status

Write-Host ""
Write-Host "Step 2: Marking failed migration as rolled back..." -ForegroundColor Cyan
$failedMigration = "20231007173937_settlement_work_v3"
Write-Host "Migration: $failedMigration" -ForegroundColor Gray

$resolve = Read-Host "Mark this migration as rolled back? (yes/no)"
if ($resolve -eq "yes") {
    npx prisma migrate resolve --rolled-back $failedMigration
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Migration marked as rolled back" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to mark migration as rolled back" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Skipped marking migration as rolled back" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 3: Checking migration status again..." -ForegroundColor Cyan
npx prisma migrate status

Write-Host ""
Write-Host "Step 4: Deploy current migrations..." -ForegroundColor Cyan
$deploy = Read-Host "Deploy migrations now? (yes/no)"
if ($deploy -eq "yes") {
    npx prisma migrate deploy
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Migrations deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to deploy migrations" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Skipped migration deployment" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 5: Generate Prisma Client..." -ForegroundColor Cyan
npx prisma generate

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Migration fix completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify the application works in production" -ForegroundColor White
Write-Host "  2. Check that all tables exist and data is intact" -ForegroundColor White
Write-Host "  3. Monitor logs for any database errors" -ForegroundColor White
Write-Host ""
Write-Host "If issues persist, refer to: docs/migration/PRODUCTION_MIGRATION_FIX.md" -ForegroundColor Gray
