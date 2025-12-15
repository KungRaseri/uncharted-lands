# Complete Fix for resources.spec.ts Test #5

## Problem
The test file was corrupted when I restored it from Git - it removed your previous visibility check fix. Now we need BOTH fixes:
1. Your visibility check (wait for House before counting)
2. My debug logging (see what's in the DOM)

## Manual Fix Required

**File**: `client/tests/e2e/resources.spec.ts`  
**Lines**: 395-420

### Replace This Section

Find these lines (around line 395-420):

```typescript
		// Wait for structure:built Socket.IO event
		await waitForSocketEvent(page, 'structure:built', 10000);

		// Wait for ONE population-state event after building
		// (Now that modifiers work correctly, capacity updates immediately)
		await waitForSocketEvent(page, 'population-state', 15000);

		// Verify structure count increased
		const newStructureCount = await page.locator('[data-testid="structure"]').count();
		expect(newStructureCount).toBe(initialStructureCount + 1);


	// Verify capacity increased after building house (12 + 5 = 17)
	// GDD specifies: HOUSE provides +5 population capacity (not +15)
	
	// DEBUG: Check actual DOM content
	const popElement = page.locator('[data-testid="current-population"]');
	const popText = await popElement.textContent();
	console.log('[DEBUG] Population element text:', popText);
	
	const newCapacity = await getPopulationCapacity(page);
	console.log('[DEBUG] getPopulationCapacity returned:', newCapacity);
	expect(newCapacity).toBe(17);
	});
});
```

### With This Fixed Code

```typescript
		// Wait for structure:built Socket.IO event
		await waitForSocketEvent(page, 'structure:built', 10000);

		// Wait for ONE population-state event after building
		// (Now that modifiers work correctly, capacity updates immediately)
		await waitForSocketEvent(page, 'population-state', 15000);

		// Wait for House to be visible BEFORE counting structures (DOM update timing)
		const houseStructure = page.locator('[data-testid="structure"]:has-text("House")');
		await expect(houseStructure).toBeVisible({ timeout: 10000 });

		// Verify structure count increased
		const newStructureCount = await page.locator('[data-testid="structure"]').count();
		expect(newStructureCount).toBe(initialStructureCount + 1);

		// Verify capacity increased after building house (12 + 5 = 17)
		// GDD specifies: HOUSE provides +5 population capacity (not +15)
		
		// DEBUG: Check actual DOM content
		const popElement = page.locator('[data-testid="current-population"]');
		const popText = await popElement.textContent();
		console.log('[DEBUG] Population element text:', popText);
		
		const newCapacity = await getPopulationCapacity(page);
		console.log('[DEBUG] getPopulationCapacity returned:', newCapacity);
		expect(newCapacity).toBe(17);
	});
});
```

## What Changed

1. **Added lines 403-405**: Visibility check for House (YOUR previous fix that got lost)
   ```typescript
   const houseStructure = page.locator('[data-testid="structure"]:has-text("House")');
   await expect(houseStructure).toBeVisible({ timeout: 10000 });
   ```

2. **Added lines 412-418**: Debug logging (MY new fix)
   ```typescript
   const popElement = page.locator('[data-testid="current-population"]');
   const popText = await popElement.textContent();
   console.log('[DEBUG] Population element text:', popText);
   
   const newCapacity = await getPopulationCapacity(page);
   console.log('[DEBUG] getPopulationCapacity returned:', newCapacity);
   ```

3. **Fixed indentation**: Removed extra blank line, fixed tab inconsistencies

## After Applying

Run the test:
```powershell
npx playwright test tests/e2e/resources.spec.ts --project=firefox -g "should increase capacity when building houses"
```

You should see in the output:
```
[BROWSER CONSOLE] [DEBUG] Population element text: <whatever is in the DOM>
[BROWSER CONSOLE] [DEBUG] getPopulationCapacity returned: <extracted value>
```

This will tell us whether the issue is server-side (wrong capacity sent) or client-side (helper extraction failing).

---

**I apologize** for the automation failures. The whitespace/tab matching in this file is very tricky. Manual editing is the safest approach.
