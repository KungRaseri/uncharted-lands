# E2E Test Refactoring Guide

## Problem Statement

**Before**: Each test suite created its own server and world in `beforeAll`, leading to:
- ❌ 112 test failures due to timeout and parameter order issues
- ❌ 26+ minute test runs for Firefox only
- ❌ Redundant server/world creation in every suite
- ❌ Database connection pool exhaustion under parallel load
- ❌ World creation taking 30-60 seconds per suite

**After**: Global setup creates shared test data ONCE:
- ✅ ~5 minute faster test runs (single setup vs 10+ setups)
- ✅ No timeout issues from world generation
- ✅ Reduced database load
- ✅ Tests focus on what they're testing, not setup
- ✅ Only tests that specifically test server/world functionality create new ones

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Global Setup (runs ONCE before all tests)              │
│  ├── Create admin account                               │
│  ├── Create/reuse "E2E Test Server" (localhost:3001)    │
│  └── Create shared world (TINY 5x5 for speed)           │
│      Store in: process.env.E2E_*                         │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Test Suite A (auth-flow.spec.ts)                       │
│  ├── Use shared server ID                               │
│  ├── Use shared world ID                                │
│  └── Create only user-specific data (players, etc)      │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Test Suite B (resources.spec.ts)                       │
│  ├── Use shared server ID                               │
│  ├── Use shared world ID                                │
│  └── Create only test-specific settlements              │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Global Teardown (runs ONCE after all tests)            │
│  └── Optional cleanup (or keep for inspection)          │
└─────────────────────────────────────────────────────────┘
```

---

## Migration Steps

### 1. Enable Global Setup (Already Done)

File: `client/playwright.config.ts`
```typescript
const config: PlaywrightTestConfig = {
	// ... other config ...
	globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
	globalTeardown: require.resolve('./tests/e2e/global-teardown.ts'),
};
```

### 2. Update Test Suites to Use Shared Data

**Before (OLD way - creating server/world per suite):**
```typescript
import { createWorldViaAPI, deleteWorld } from './helpers/worlds';

let testWorldId: string;
let testServerId: string;
let adminSessionToken: string;

test.beforeAll(async ({ browser }) => {
	test.setTimeout(60000); // Long timeout for world creation
	
	// Register admin
	const adminEmail = generateUniqueEmail('admin');
	await registerUser(page, adminEmail, password);
	adminSessionToken = getSessionToken();
	
	// Elevate to admin
	await page.request.put(`${API}/test/elevate-admin/${adminEmail}`);
	
	// Create server
	const serverResponse = await page.request.post(`${API}/servers`, {
		headers: { Cookie: `session=${adminSessionToken}` },
		data: { name: 'Test Server', hostname: 'localhost', port: 3001 }
	});
	testServerId = (await serverResponse.json()).id;
	
	// Create world (30-60 seconds!)
	const worldData = await createWorldViaAPI(
		page.request,
		testServerId,
		adminSessionToken,
		{ name: `Test World ${Date.now()}`, size: 'TINY' }
	);
	testWorldId = worldData.id;
});
```

**After (NEW way - using shared data):**
```typescript
import { getSharedTestData } from './helpers/shared-data';

let testSettlementId: string;
let sessionToken: string;

test.beforeAll(async ({ browser }) => {
	// Get shared data (instant, no creation needed!)
	const sharedData = getSharedTestData();
	
	const context = await browser.newContext();
	const page = await context.newPage();
	
	// Register test user
	const email = generateUniqueEmail('test-user');
	await registerUser(page, email, password);
	sessionToken = getSessionToken();
	
	// Create only test-specific data (settlement)
	const settlement = await createSettlementViaAPI(
		page.request,
		sessionToken,
		sharedData.generalWorldId!, // Use shared world
		'Test Settlement',
		{ x: 2, y: 2 }
	);
	testSettlementId = settlement.id;
	
	await page.close();
	await context.close();
});
```

### 3. Clean Up Only Test-Specific Data

```typescript
test.afterAll(async ({ browser }) => {
	const context = await browser.newContext();
	const page = await context.newPage();

	// Clean up ONLY test-specific data
	if (testSettlementId && sessionToken) {
		await deleteSettlement(page.request, testSettlementId);
	}
	
	if (testUserEmail) {
		await cleanupTestUser(page.request, testUserEmail);
	}
	
	// DON'T delete shared server or world!
	// Global teardown handles that
	
	await page.close();
	await context.close();
});
```

---

## When to Create New Servers/Worlds

### Use Shared Data ✅ (99% of tests)
- Auth flow tests
- Resource production tests
- Structure building tests
- Population management tests
- UI/UX tests
- Disaster tests (if not testing disaster generation)
- Multiplayer tests (if testing player interactions, not world creation)

### Create New Server/World ❌ (Only when specifically testing these features)
- **Server creation tests** (`servers.spec.ts`)
  - Testing server CRUD operations
  - Testing server status updates
  - Testing server validation

- **World creation tests** (`worlds.spec.ts`)
  - Testing world generation
  - Testing different world sizes
  - Testing world templates
  - Testing biome distribution

- **Disaster generation tests** (`disaster-generation.spec.ts`)
  - Testing disaster spawn rates
  - Testing disaster templates
  - Testing world-specific disaster config

---

## Shared Test Data API

File: `client/tests/e2e/helpers/shared-data.ts`

```typescript
import { getSharedTestData } from './helpers/shared-data';

const sharedData = getSharedTestData();

// Available data:
sharedData.testServerId      // "server-id-123" (always available)
sharedData.adminEmail         // "e2e-admin-1234@test.local"
sharedData.adminSessionToken  // "session-token-xyz"
sharedData.generalWorldId     // "world-id-456" (for most tests)
sharedData.disasterWorldId    // undefined (reserved for disaster tests)
sharedData.multiplayerWorldId // undefined (reserved for multiplayer tests)
```

---

## Benefits

### Performance
- ⚡ **~5 minutes faster** - Single world generation vs 10+ generations
- ⚡ **Faster test startup** - No beforeAll timeout waiting for world creation
- ⚡ **Reduced database load** - Fewer INSERT/DELETE operations

### Reliability
- ✅ **No timeout failures** - World already exists
- ✅ **No parameter order bugs** - Simplified setup means fewer places to make mistakes
- ✅ **No database connection exhaustion** - Fewer parallel operations

### Maintainability
- 📝 **Less boilerplate** - 30 lines of setup → 10 lines
- 📝 **Clearer intent** - Tests focus on what they're testing
- 📝 **Easier debugging** - Consistent shared world state

### Cost
- 💰 **Less CI time** - Faster tests = cheaper CI bills
- 💰 **Less developer time** - Fewer flaky tests to debug

---

## Migration Checklist

For each test suite:

- [ ] Check if test specifically tests server/world functionality
  - ❌ **No**: Migrate to shared data
  - ✅ **Yes**: Keep custom server/world creation

- [ ] Update imports
  - [ ] Remove `createWorldViaAPI`, `deleteWorld`
  - [ ] Add `getSharedTestData`

- [ ] Update `beforeAll`
  - [ ] Remove admin account creation
  - [ ] Remove server creation
  - [ ] Remove world creation
  - [ ] Add `const sharedData = getSharedTestData()`
  - [ ] Keep user/settlement creation (test-specific)

- [ ] Update `afterAll`
  - [ ] Remove world deletion
  - [ ] Remove server deletion
  - [ ] Keep user/settlement cleanup

- [ ] Run test suite to verify
  - [ ] Tests pass
  - [ ] No timeout errors
  - [ ] Faster execution

---

## Files to Update

### Priority 1 (Failing Tests - Fix Parameter Order Issue)
These have `createWorldViaAPI` parameter order wrong:
```
client/tests/e2e/building-area-system.spec.ts
client/tests/e2e/disaster.spec.ts
client/tests/e2e/settlement-ui.spec.ts
```

**Fix**: Change parameter order OR migrate to shared data (recommended)

### Priority 2 (Migrate to Shared Data - High Impact)
These create redundant servers/worlds:
```
client/tests/e2e/auth/auth-flow.spec.ts
client/tests/e2e/auth/login.spec.ts
client/tests/e2e/auth/register.spec.ts
client/tests/e2e/resources.spec.ts
client/tests/e2e/structures.spec.ts
client/tests/e2e/population.spec.ts
client/tests/e2e/construction-queue.spec.ts
client/tests/e2e/errors.spec.ts
```

### Priority 3 (Keep Custom Creation - Testing Server/World Features)
These SHOULD create their own servers/worlds:
```
client/tests/e2e/multiplayer.spec.ts (testing world isolation)
client/tests/e2e/network.spec.ts (testing multi-settlement networks)
```

---

## Example: Complete Migration

See `client/tests/e2e/EXAMPLE-using-shared-data.spec.ts` for a complete working example.

---

## Troubleshooting

### "Shared test data not available"
**Problem**: Global setup didn't run
**Solution**: Run full suite with `npm run test:e2e` (not individual files with `:only`)

### "World generation still slow"
**Problem**: Test creating its own world
**Solution**: Check test isn't calling `createWorldViaAPI` - use shared data instead

### "Tests interfering with each other"
**Problem**: Multiple tests modifying same settlement
**Solution**: Each test should create its own settlement in shared world

### "Need different world for specific tests"
**Problem**: Disaster tests need disaster-enabled world
**Solution**: Create `disasterWorldId` in global-setup.ts if needed, or let those tests create their own

---

## Next Steps

1. ✅ Global setup created (`global-setup.ts`)
2. ✅ Global teardown created (`global-teardown.ts`)
3. ✅ Shared data helper created (`helpers/shared-data.ts`)
4. ✅ Example test created (`EXAMPLE-using-shared-data.spec.ts`)
5. ⏳ Update Priority 1 tests (parameter order fix)
6. ⏳ Update Priority 2 tests (migrate to shared data)
7. ⏳ Update Priority 3 tests (verify custom creation still needed)

Expected outcome: **~90-95% of tests migrated to shared data, test suite runs in <20 minutes**
