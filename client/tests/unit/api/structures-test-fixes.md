# Unit Test Fixes for structures.test.ts

## Issues Found

### 1. Error Message Mismatch
**Problem**: Tests expect "Failed to fetch structure metadata" but actual code throws "API request failed"
**Location**: fetchStructureMetadata function, line 86 in structures.ts
**Fix**: Update test expectations to match actual error messages

### 2. canBuildStructure Return Type Mismatch
**Problem**: Tests expect `boolean` but function returns `{ canBuild: boolean, reasons: string[] }`
**Fix**: Update all test assertions to check the object structure

### 3. getStructureMetadata Behavior Mismatch
**Problem**: Tests expect empty array on error, but function returns `undefined` (it's a wrapper that finds by ID)
**Actual Behavior**: `getStructureMetadata(id, fetch)` calls `fetchStructureMetadata(fetch)` then finds by ID
**Fix**: Tests need to mock the entire fetchStructureMetadata behavior and check for `undefined` instead of `[]`

## Recommended Action

Rather than fixing all 27 tests individually, I recommend:

**Option A - Quick Fix** (10-15 min):
- Fix error message expectations (2 tests)
- Fix canBuildStructure return type checks (6 tests)
- Fix getStructureMetadata behavior (4 tests)
- Keep comprehensive structure but align with actual implementation

**Option B - Rewrite** (30 min):
- Start fresh with implementation-first testing
- Write tests that match actual function signatures
- Add additional edge cases discovered during testing

**RECOMMENDATION**: Option A - The test structure is solid, just needs alignment with actual implementation.
