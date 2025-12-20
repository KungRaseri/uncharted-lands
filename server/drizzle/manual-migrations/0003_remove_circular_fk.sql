-- Migration: Remove circular FK between Settlement and SettlementStorage
-- Date: 2025-12-19
-- Issue: Bidirectional FK relationship causes circular reference errors

-- Step 1: Make settlementId NOT NULL and UNIQUE on SettlementStorage
ALTER TABLE "SettlementStorage"
ALTER COLUMN "settlementId" SET NOT NULL;

ALTER TABLE "SettlementStorage"
ADD CONSTRAINT "SettlementStorage_settlementId_unique" UNIQUE ("settlementId");

-- Step 2: Drop the circular FK from Settlement to SettlementStorage
ALTER TABLE "Settlement"
DROP COLUMN IF EXISTS "settlementStorageId";

-- Step 3: Ensure all existing settlements have storage
-- (This will be handled by the fix-missing-storage.ts script)

-- Result: Clean one-way relationship
-- Settlement -> SettlementStorage.settlementId -> Settlement
-- Storage always belongs to exactly one settlement
-- Find storage via: WHERE settlementId = ?
