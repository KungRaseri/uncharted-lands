# Quick Fix: Failed Migration in Production

## The Problem
```
Error: P3009
The `20231007173937_settlement_work_v3` migration started at 2023-10-11 03:18:51.856256 UTC failed
```

## Immediate Solution

### Option 1: Let the Build Script Handle It (Recommended)
The build script will now automatically detect and resolve this failed migration.

Just redeploy:
```bash
git push
```

The build will automatically:
1. Detect the failed migration
2. Mark it as rolled back
3. Deploy current migrations
4. Continue with the build

### Option 2: Manual Fix (If build script doesn't work)

**Step 1:** Connect to production database
Make sure your `DATABASE_URL` in `.env` points to production.

**Step 2:** Mark the failed migration as rolled back
```bash
npx prisma migrate resolve --rolled-back 20231007173937_settlement_work_v3
```

**Step 3:** Deploy current migrations
```bash
npx prisma migrate deploy
```

**Step 4:** Generate Prisma Client
```bash
npx prisma generate
```

**Step 5:** Rebuild and deploy
```bash
npm run build
```

### Option 3: Use the PowerShell Script (Windows)
```powershell
.\scripts\fix-production-migration.ps1
```

### Option 4: Use the Bash Script (Linux/Mac)
```bash
chmod +x scripts/deploy-migrations.sh
./scripts/deploy-migrations.sh
```

## Why This Happened

The migration `20231007173937_settlement_work_v3` was applied to production but:
1. It doesn't exist in the current codebase
2. It failed during application
3. Now it's blocking new migrations

This typically happens when:
- Someone ran migrations locally that weren't committed
- The migration was manually created in production
- The migration file was deleted after being applied

## What We Did to Prevent This

1. ✅ Updated build script to auto-detect and fix known failed migrations
2. ✅ Created `scripts/pre-build-migrations.js` to handle this automatically
3. ✅ Added manual fix scripts for emergency use
4. ✅ Created comprehensive documentation

## Next Steps

1. **Try redeploying** - The build script should fix it automatically
2. **If that fails** - Use the manual fix steps above
3. **Verify it worked** - Check that the deployment succeeds
4. **Monitor** - Watch logs to ensure the app works correctly

## Need Help?

See the full documentation: `docs/migration/PRODUCTION_MIGRATION_FIX.md`

## Commands Reference

```bash
# Check migration status
npx prisma migrate status

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration-name>

# Deploy migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Run the automated fix
npm run migrate:fix
```
