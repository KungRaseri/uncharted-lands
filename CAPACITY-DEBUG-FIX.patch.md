# Capacity Debug Fix - Manual Patch

> **Issue**: Test fails at line 414 - `getPopulationCapacity` returns 0 instead of 17  
> **Root Cause Investigation**: Need to see actual DOM content to diagnose

## Problem Analysis

1. **Browser console shows**: `[POPULATION] DEBUG - Capacity value: 12 number`
2. **Test receives**: 0 (from `getPopulationCapacity`)
3. **Expected**: 17 (12 base + 5 for HOUSE)

**Two potential issues**:
- Server sends capacity=12 instead of 17 (population calculated without new structure?)
- Helper function returns 0 (selector or text format issue?)

## Manual Fix Required

**File**: `client/tests/e2e/resources.spec.ts`  
**Lines**: 411-414

### OLD CODE (Lines 411-414)

```typescript
		// Verify capacity increased after building house (12 + 5 = 17)
		// GDD specifies: HOUSE provides +5 population capacity (not +15)
		const newCapacity = await getPopulationCapacity(page);
		expect(newCapacity).toBe(17);
```

### NEW CODE (Add debug logging)

```typescript
		// Verify capacity increased after building house (12 + 5 = 17)
		// GDD specifies: HOUSE provides +5 population capacity (not +15)
		
		// DEBUG: Check actual DOM content
		const popElement = page.locator('[data-testid="current-population"]');
		const popText = await popElement.textContent();
		console.log('[DEBUG] Population element text:', popText);
		
		const newCapacity = await getPopulationCapacity(page);
		console.log('[DEBUG] getPopulationCapacity returned:', newCapacity);
		expect(newCapacity).toBe(17);
```

## What This Will Tell Us

After running the test with this debug logging, we'll see:

1. **Actual DOM content**: What text is in the `[data-testid="current-population"]` element?
2. **Helper result**: What value does `getPopulationCapacity` extract from that text?

### Possible Outcomes

**Scenario A: Text is "10 / 12"**
- Server is sending old capacity (12) not new capacity (17)
- Root cause: Population calculated before new structure committed to database
- Fix: Verify query timing in handlers.ts

**Scenario B: Text is "10 / 17"**
- Server is sending correct capacity
- Helper function failing to extract it
- Root cause: Regex or selector issue
- Fix: Fix helper function or text format

**Scenario C: Text is something else**
- Unexpected format (e.g., "10 of 17", "10/17" no spaces)
- Root cause: Display format doesn't match expected regex `/\d+\s*\/\s*(\d+)/`
- Fix: Update regex or fix display format

## Instructions

1. **Open**: `client/tests/e2e/resources.spec.ts`
2. **Navigate to**: Line 411 (or search for "Verify capacity increased")
3. **Select lines 411-414**
4. **Replace with**: The NEW CODE above
5. **Save file**
6. **Run test**: `npx playwright test tests/e2e/resources.spec.ts --project=firefox -g "should increase capacity when building houses"`
7. **Check output**: Look for `[DEBUG]` lines in console

## Expected Output Example

```
[DEBUG] Population element text: 10 / 12
[DEBUG] getPopulationCapacity returned: 12

Error: expect(received).toBe(expected)
Expected: 17
Received: 12
```

or

```
[DEBUG] Population element text: 10 / 17
[DEBUG] getPopulationCapacity returned: 0

Error: expect(received).toBe(expected)
Expected: 17
Received: 0
```

## Next Steps (After Diagnosis)

Once we see the debug output, we'll know which fix to apply:

1. If text shows "X / 12": Fix server-side population calculation timing
2. If text shows "X / 17" but helper returns 0: Fix helper regex/selector
3. If text is in wrong format: Fix display component or update regex

---

**Created**: December 8, 2025  
**Purpose**: Diagnose why capacity check fails  
**Related**: SELECTOR-TIMING-FIX.patch.md (previous fix applied successfully)
