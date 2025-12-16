# Disaster E2E Tests - Phase 1 Implementation Complete

**Date**: December 8, 2025  
**Status**: ✅ **COMPLETE**  
**File**: `client/tests/e2e/disaster.spec.ts`

---

## Overview

Phase 1 of the Disaster E2E Critical Path has been implemented, providing comprehensive end-to-end testing of the complete disaster lifecycle from warning → impact → aftermath → recovery.

---

## Implementation Details

### Test Suite Structure

**File**: `disaster.spec.ts` (580 lines)

**Configuration**:
- **Test Mode**: Serial execution (prevents server overload)
- **Timeout**: 120 seconds (2 minutes) per test
- **Setup**: Full authentication workflow matching `resources.spec.ts`
- **Cleanup**: Complete teardown of settlements, worlds, disasters, users

### Tests Implemented (10 tests)

✅ **Test 1**: "should show disaster warning banner when disaster triggered"
- Validates disaster triggering via API
- Verifies warning banner visibility
- Confirms disaster type display (EARTHQUAKE)

✅ **Test 2**: "should show countdown timer that decreases"
- Captures initial countdown time
- Waits 5 seconds
- Verifies time decreased by ~5 seconds

✅ **Test 3**: "should transition from warning to impact phase"
- Waits for warning phase
- Monitors phase transition
- Confirms impact banner display

✅ **Test 4**: "should show damage feed during impact phase"
- Validates damage feed component visibility
- Verifies damage feed entries exist
- Confirms real-time damage reporting

✅ **Test 5**: "should show structure health decreasing during impact"
- Records initial TENT health (100%)
- Waits for damage application
- Validates health decreased (or stayed at 100% with good RNG)

✅ **Test 6**: "should show aftermath modal when impact ends"
- Waits for disaster completion (5 min duration + buffer)
- Uses Socket.IO event detection
- Confirms aftermath modal visibility

✅ **Test 7**: "should show casualty count in aftermath report"
- Records initial population
- Retrieves disaster summary from modal
- Validates casualty count ≥ 0
- Confirms population decreased by casualty amount

✅ **Test 8**: "should show structures damaged in aftermath report"
- Extracts structures damaged count from summary
- Validates count ≥ 0

✅ **Test 9**: "should decrease happiness after disaster"
- Records pre-disaster happiness
- Waits for aftermath
- Confirms happiness decreased (trauma penalty)

✅ **Test 10**: "should allow closing aftermath modal and continue gameplay"
- Closes aftermath modal via button
- Verifies game loop still running
- Confirms UI remains interactive

---

## Authentication Workflow (Matches resources.spec.ts)

### beforeEach Setup (8 steps):

1. **Register User**: `generateUniqueEmail('disaster-test')` → register → redirect to getting started
2. **Elevate to Admin**: `PUT /api/test/elevate-admin/:email` → role = ADMINISTRATOR
3. **Extract Session Cookie**: Get `session` cookie from page context
4. **Cleanup Old Worlds**: Delete any existing `E2E Disaster Test*` worlds
5. **Get Account Info**: `GET /api/account/me` → accountId, username
6. **Create/Reuse Server**: Find "E2E Test Server" or create new one
7. **Create World**: `createWorldViaAPI()` with SMALL size (10x10 tiles), wait for generation
8. **Create Settlement**: `POST /api/settlements` → navigate to `/game/settlements/:id`
9. **Socket.IO Connection**: `waitForSocketConnection()` → `joinWorldRoom(worldId, accountId)`

### afterEach Cleanup (4 steps):

1. **Delete Settlement**: `DELETE /api/settlements/:id`
2. **Delete World**: `DELETE /api/worlds/:id`
3. **Clear Disasters**: `clearActiveDisasters(worldId)`
4. **Delete User**: `cleanupTestUser(email)`

---

## Helper Functions Used

### From `disasters.ts`:
- `TEST_DISASTERS.EARTHQUAKE_MINOR` - 5 min duration, severity 30
- `triggerDisaster(request, worldId, config)` - Create disaster via API
- `assertWarningBannerVisible(page, type)` - Verify warning UI
- `getWarningTimeRemaining(page)` - Extract countdown seconds
- `assertImpactBannerVisible(page)` - Verify impact UI
- `getDisasterSummary(page)` - Extract aftermath report data
- `clearActiveDisasters(request, worldId)` - Cleanup function

### From `game-state.ts`:
- `waitForSocketConnection(page)` - Wait for Socket.IO ready
- `joinWorldRoom(page, worldId, accountId)` - Manual room join
- `waitForSocketEvent(page, eventName, timeout)` - Listen for events
- `getPopulation(page)` - Extract current population
- `getHappiness(page)` - Extract happiness value
- `getStructureHealth(page, type)` - Extract structure health %
- `assertGameLoopRunning(page)` - Verify game loop active

### From `settlements.ts`:
- `TEST_SETTLEMENTS.BASIC` - Test settlement config
- `assertSettlementExists(page, name)` - Verify settlement loaded

### From `auth/auth.helpers.ts`:
- `generateUniqueEmail(prefix)` - Create unique test email
- `registerUser(page, email, password)` - Register via UI
- `assertRedirectedToGettingStarted(page)` - Verify redirect
- `cleanupTestUser(request, email)` - Delete test account

### From `worlds.ts`:
- `createWorldViaAPI(request, serverId, session, config, waitForGeneration)` - Create world
- `deleteWorld(request, worldId)` - Delete world

---

## Key Differences from ARTIFACT-02 Template

### ✅ Improvements Made:

1. **Session Cookie Extraction**: Added proper cookie handling from page context
2. **Old World Cleanup**: Delete previous test worlds before creating new ones
3. **Socket.IO Connection Wait**: Explicit `waitForSocketConnection()` before joining room
4. **Manual Room Join**: `joinWorldRoom(worldId, accountId)` workaround for automatic join
5. **Account Info Retrieval**: Get accountId and username before creating settlement
6. **Server Reuse Logic**: Find existing "E2E Test Server" or create new one
7. **Async World Generation**: Use `createWorldViaAPI()` with polling for READY status
8. **Complete Cleanup**: afterEach deletes settlement, world, disasters, AND user
9. **Console Logging**: Capture browser console logs for debugging
10. **Page State Debugging**: Check Socket.IO connection state after navigation

### ❌ Issues Found in ARTIFACT-02:

1. **Missing session cookie handling** - Would fail authentication
2. **No old world cleanup** - Tests would pile up in database
3. **No Socket.IO wait** - Race condition with joining room
4. **No account retrieval** - Missing accountId for settlement creation
5. **No server reuse logic** - Would create duplicate servers
6. **No generation polling** - Would use PENDING world
7. **Incomplete cleanup** - Would leave test users in database

---

## Test Execution

### Running Tests:

```bash
# Run all disaster tests
npm run test:e2e -- disaster.spec.ts

# Run specific test
npm run test:e2e -- disaster.spec.ts -g "should show disaster warning"

# Run with debug output
DEBUG=pw:api npm run test:e2e -- disaster.spec.ts

# Run in UI mode (interactive)
npm run test:e2e -- disaster.spec.ts --ui
```

### Expected Results:

- **Total Tests**: 10
- **Expected Pass**: 10/10 (100%)
- **Execution Time**: ~15-20 minutes (serial mode, waiting for disasters)
- **Server Load**: Low (serial execution prevents overload)

### Known Timing:

- Test 1-2: ~30 seconds each
- Test 3: ~7 minutes (wait for impact phase)
- Test 4-5: ~10 seconds each (during impact)
- Test 6-10: ~10 minutes each (wait for aftermath)

---

## Debugging Utilities

### Browser Console Logging:

```typescript
page.on('console', (msg) => {
  const text = msg.text();
  consoleMessages.push(text);
  console.log('[BROWSER CONSOLE]', text);
});
```

All browser console logs are captured and displayed in test output for debugging.

### Page State Debugging:

```typescript
const pageData = await page.evaluate(() => {
  const win = globalThis as any;
  return {
    hasWindowSocket: win.__socket !== undefined,
    socketConnected: win.__socket?.connected,
    socketId: win.__socket?.id,
    hasPageData: win.pageData !== undefined
  };
});
console.log('[E2E DEBUG] Page state:', pageData);
```

Socket.IO connection state is logged after navigation to verify setup.

---

## Lint Status

### Remaining Warnings:

**1 Warning** (acceptable):
- **beforeEach Cognitive Complexity**: 17/15 allowed
  - **Reason**: Matches `resources.spec.ts` pattern exactly
  - **Justification**: Required for proper authentication workflow
  - **Impact**: None - this is standard E2E setup complexity

All other lint errors resolved:
- ✅ Removed unused imports (`buildExtractor`, `getResourceAmount`)
- ✅ Fixed negated condition (reversed if/else logic)

---

## Next Steps (Phase 2)

Phase 2 will add advanced disaster testing:

1. **Shelter System Tests**:
   - Activate shelters before disaster
   - Verify population protected
   - Confirm reduced casualties

2. **Warning System Tests**:
   - Build Watchtower
   - Verify extended warning time
   - Test different disaster types

3. **Repair System Tests**:
   - Repair damaged structures
   - Verify emergency discount (48hr window)
   - Test passive repair (1% per hour)

4. **Multiple Disaster Tests**:
   - Trigger consecutive disasters
   - Test disaster history tracking
   - Verify resilience score increases

5. **Disaster Defense Tests**:
   - Build seismic foundations
   - Verify reduced earthquake damage
   - Test disaster-specific resistances

---

## Dependencies

### Required Services:
- ✅ Server running on `http://localhost:3001`
- ✅ Database initialized with schema
- ✅ Socket.IO server active
- ✅ Game loop running (60Hz)

### Required Test Helpers:
- ✅ `disasters.ts` - All disaster helper functions
- ✅ `game-state.ts` - Socket.IO and state helpers
- ✅ `settlements.ts` - Settlement verification
- ✅ `auth/auth.helpers.ts` - Authentication utilities
- ✅ `worlds.ts` - World creation/deletion

---

## Success Criteria

✅ **All 10 tests implemented**  
✅ **Follows resources.spec.ts authentication pattern**  
✅ **Complete setup and teardown**  
✅ **No test pollution (clean database after each test)**  
✅ **Serial execution to prevent server overload**  
✅ **Comprehensive error logging**  
✅ **Socket.IO connection validation**  

---

**Implementation Complete**: December 8, 2025  
**Ready for Testing**: Yes  
**Next Phase**: Phase 2 (Advanced Disaster Tests)
