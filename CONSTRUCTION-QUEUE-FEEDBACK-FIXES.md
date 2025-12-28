# Construction Queue Feedback & UI Fixes

**Date**: December 24, 2025
**Status**: Implementation Plan

## Issues Identified

1. **Socket Progress Updates Not Working** - Construction progress doesn't update in real-time
2. **No Insufficient Resources Feedback** - Silent failure when player can't afford structure  
3. **Slot Locked State Not Shown** - Queued extractors don't visually lock their slots
4. **Browser Alert for Demolish** - Uses `alert()` instead of proper modal
5. **Total Population Calculation Wrong** - Not summing population_capacity from all housing

---

## Issue #1: Socket Progress Updates

**Problem**: Server only processes construction completions, never emits progress events during construction.

**Current Behavior**:
- `processConstructionQueues()` runs every second
- Only emits `construction-complete` when finished
- Client has `startProgressTicker()` that calculates progress locally
- Local calculation doesn't sync with server

**Root Cause**:
- No `construction-progress` socket emission in game loop
- Client expects server to send progress updates but server never does

**Solution**:
Add progress broadcast in `construction-queue-processor.ts`:

```typescript
// NEW FUNCTION: Emit progress for active constructions
export async function broadcastConstructionProgress(
	worldId: string,
	currentTime: number,
	io: SocketIOServer
): Promise<void> {
	const activeConstructions = await db
		.select({
			construction: constructionQueue,
			settlement: settlements,
		})
		.from(constructionQueue)
		.innerJoin(settlements, eq(constructionQueue.settlementId, settlements.id))
		.innerJoin(tiles, eq(settlements.tileId, tiles.id))
		.innerJoin(regions, eq(tiles.regionId, regions.id))
		.where(
			and(
				eq(regions.worldId, worldId),
				eq(constructionQueue.status, 'IN_PROGRESS')
			)
		);

	for (const { construction, settlement } of activeConstructions) {
		const startTime = construction.startedAt?.getTime() || currentTime;
		const endTime = construction.completesAt?.getTime() || currentTime;
		const elapsed = currentTime - startTime;
		const total = endTime - startTime;
		const progress = Math.min(100, Math.max(0, Math.floor((elapsed / total) * 100)));
		const timeRemaining = Math.max(0, Math.ceil((endTime - currentTime) / 1000));

		io.to(`world:${worldId}`).emit('construction-progress', {
			settlementId: settlement.id,
			projectId: construction.id,
			progress,
			timeRemaining,
			timestamp: currentTime,
		});
	}
}
```

Call from `game-loop.ts` every second:

```typescript
if (currentTick % TICK_RATE === 0) {
	for (const world of activeWorlds) {
		try {
			await processConstructionQueues(world.id, currentTime, io);
			await broadcastConstructionProgress(world.id, currentTime, io); // NEW
		} catch (error) {
			logger.error('[CONSTRUCTION QUEUE] Error', { error });
		}
	}
}
```

**Files to Change**:
- `server/src/game/construction-queue-processor.ts` - Add `broadcastConstructionProgress()`
- `server/src/game/game-loop.ts` - Call new function every second

---

## Issue #2: Insufficient Resources Feedback

**Problem**: When player tries to build without enough resources, API returns 400 error but UI shows no feedback.

**Current Behavior**:
- API returns `{ success: false, error: "Insufficient resources", shortages: [...] }`
- Client checks `result.success` but doesn't show toast/notification
- User clicks "Build" and nothing happens

**Solution**:
Add toast notifications using Skeleton's toast store:

**MobileBuildMenu.svelte**:
```svelte
<script>
	import { toastStore } from '@skeletonlabs/skeleton';

	async function handleBuild(structureId: string) {
		// ... existing code ...

		if (!result.success) {
			// Show error toast
			if (result.shortages && result.shortages.length > 0) {
				const shortageText = result.shortages
					.map((s: any) => `${s.type}: need ${s.missing} more`)
					.join(', ');
				
				toastStore.trigger({
					message: `Insufficient Resources: ${shortageText}`,
					background: 'variant-filled-error',
					timeout: 5000,
				});
			} else {
				toastStore.trigger({
					message: result.message || 'Failed to build structure',
					background: 'variant-filled-error',
					timeout: 5000,
				});
			}
			return;
		}
	}
</script>
```

**Files to Change**:
- `client/src/lib/components/game/MobileBuildMenu.svelte`
- `client/src/lib/components/game/SettlementDashboard.svelte` (for extractor builds)

---

## Issue #3: Slot Locked State Not Shown

**Problem**: When extractor is queued for construction, the slot doesn't show as locked/reserved.

**Current State**:
- TileSlotsPanel shows slots as "occupied" only if structure exists
- Doesn't check `constructionQueue` table for pending constructions

**Solution**:
Query construction queue when loading settlement to get reserved slots:

**TileSlotsPanel.svelte**:
```svelte
<script>
	let queuedConstructions = $state<Array<{tileId: string, slotPosition: number}>>([]);

	// Check if slot is reserved by queued construction
	function isSlotReserved(slotPosition: number): boolean {
		return queuedConstructions.some(
			(q) => q.tileId === tile.id && q.slotPosition === slotPosition
		);
	}

	function isSlotOccupied(slotPosition: number): boolean {
		return getExtractorInSlot(slotPosition) !== null || isSlotReserved(slotPosition);
	}

	// Visual state
	<button
		class="... {isSlotReserved(slotPosition) 
			? 'border-warning-500 bg-warning-50 dark:bg-warning-950 cursor-not-allowed opacity-60'
			: occupied 
				? 'border-primary-500 bg-primary-50'
				: 'border-surface-300 bg-surface-50 border-dashed'}"
		disabled={isSlotReserved(slotPosition)}
		aria-label={isSlotReserved(slotPosition) 
			? `Slot ${slotPosition + 1}: Reserved (under construction)`
			: getSlotLabel(slotPosition)}
	>
		{#if isSlotReserved(slotPosition)}
			<span class="text-2xl">🔒</span>
			<span class="text-xs text-warning-700 dark:text-warning-400">Queued</span>
		{:else if extractor}
			<!-- existing extractor UI -->
		{:else}
			<!-- empty slot UI -->
		{/if}
	</button>
</script>
```

**Backend Change** (API to include queued constructions):

```typescript
// Add to settlement load endpoint
const queuedConstructions = await db
	.select({
		tileId: constructionQueue.tileId,
		slotPosition: constructionQueue.slotPosition,
		structureType: constructionQueue.structureType,
	})
	.from(constructionQueue)
	.where(
		and(
			eq(constructionQueue.settlementId, settlementId),
			sql`${constructionQueue.status} != 'COMPLETE'`,
			sql`${constructionQueue.tileId} IS NOT NULL` // Only extractors
		)
	);
```

**Files to Change**:
- `client/src/lib/components/game/panels/TileSlotsPanel.svelte`
- `server/src/api/routes/structures.ts` (GET construction queue endpoint)
- `client/src/routes/(protected)/game/settlements/[id]/+page.server.ts` (pass queued data)

---

## Issue #4: Demolish Browser Alert → Modal

**Problem**: Uses `confirm()` browser dialog instead of in-game modal.

**Current Code** (`SettlementDashboard.svelte:393`):
```svelte
async function handleDemolishBuilding(buildingId: string) {
	if (!confirm('Are you sure...')) return;
	// ...delete building
}
```

**Solution**:
Create `ConfirmModal.svelte` component:

```svelte
<!-- client/src/lib/components/ui/ConfirmModal.svelte -->
<script lang="ts">
	let {
		open = false,
		title = 'Confirm Action',
		message,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		variant = 'error' as 'error' | 'warning' | 'info',
		onConfirm,
		onCancel
	}: {
		open?: boolean;
		title?: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'error' | 'warning' | 'info';
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();
</script>

{#if open}
	<div class="modal-backdrop" onclick={onCancel}>
		<div class="modal" onclick={(e) => e.stopPropagation()}>
			<header class="modal-header">
				<h3 class="h3">{title}</h3>
			</header>
			<section class="modal-body">
				<p>{message}</p>
			</section>
			<footer class="modal-footer flex gap-3 justify-end">
				<button class="btn variant-ghost" onclick={onCancel}>
					{cancelText}
				</button>
				<button 
					class="btn variant-filled-{variant}" 
					onclick={onConfirm}
				>
					{confirmText}
				</button>
			</footer>
		</div>
	</div>
{/if}
```

**Usage in SettlementDashboard.svelte**:
```svelte
<script>
	let demolishModalOpen = $state(false);
	let buildingToDemolish = $state<string | null>(null);

	function handleDemolishBuilding(buildingId: string) {
		buildingToDemolish = buildingId;
		demolishModalOpen = true;
	}

	async function confirmDemolish() {
		if (!buildingToDemolish) return;
		demolishModalOpen = false;

		try {
			const formData = new FormData();
			formData.append('structureId', buildingToDemolish);
			// ... existing demolish code
		} finally {
			buildingToDemolish = null;
		}
	}
</script>

<ConfirmModal
	open={demolishModalOpen}
	title="Demolish Building"
	message="Are you sure you want to demolish this building? This action cannot be undone and you will not receive resources back."
	confirmText="Demolish"
	cancelText="Cancel"
	variant="error"
	onConfirm={confirmDemolish}
	onCancel={() => { demolishModalOpen = false; buildingToDemolish = null; }}
/>
```

**Files to Change**:
- `client/src/lib/components/ui/ConfirmModal.svelte` (NEW)
- `client/src/lib/components/game/SettlementDashboard.svelte`
- `client/src/lib/components/game/panels/BuildingsListPanel.svelte`
- `client/src/lib/components/game/panels/ExtractorsGridPanel.svelte`

---

## Issue #5: Total Population Calculation

**Problem**: Population capacity not being calculated correctly - not summing from all housing structures.

**Current Implementation** (`+page.svelte:99-140`):
```svelte
let calculatedCapacity = 10; // Base capacity
if (data.settlementStructures) {
	const housingStructures = data.settlementStructures.filter(
		(s: any) => s.buildingType === 'HOUSING'
	);

	for (const house of housingStructures) {
		if (house.modifiers) {
			const capacityMod = house.modifiers.find(
				(m: any) => m.name === 'population_capacity'
			);
			if (capacityMod) {
				calculatedCapacity += capacityMod.value;
			}
		}
	}
}
```

**Issues**:
1. Filters by `buildingType === 'HOUSING'` but schema has `category` not `buildingType`
2. Looking for `m.name === 'population_capacity'` (snake_case) which is correct
3. But structures might not have modifiers loaded in join

**Solution**:
Use server-side calculation from `calculatePopulationCapacity()`:

**Server-side** (already exists in `consumption-calculator.ts`):
```typescript
export function calculatePopulationCapacity(structures: Structure[]): number {
	let capacity = CONSUMPTION_RATES.BASE_POPULATION_CAPACITY; // 10

	for (const structure of structures) {
		for (const modifier of structure.modifiers) {
			if (modifier.name === MODIFIER_NAMES.POPULATION_CAPACITY) {
				capacity += modifier.value;
			}
		}
	}

	return Math.max(0, Math.floor(capacity));
}
```

**Fix**: Ensure settlement load includes full modifier data:

```typescript
// +page.server.ts
const settlementStructures = await db.query.settlementStructures.findMany({
	where: eq(settlementStructures.settlementId, params.id),
	with: {
		structure: true,
		modifiers: true, // ✅ ENSURE THIS IS LOADED
	},
});

// Calculate capacity server-side
import { calculatePopulationCapacity } from '$lib/server/utils/population';

const mappedStructures = settlementStructures.map(s => ({
	name: s.structure.name,
	modifiers: s.modifiers || []
}));

const populationCapacity = calculatePopulationCapacity(mappedStructures);

return {
	settlement: { ...settlement, populationCapacity },
	settlementStructures,
};
```

**Client-side** (use server-calculated value):
```svelte
// +page.svelte - REMOVE manual calculation
const populationCapacity = data.settlement.populationCapacity || 10;
populationStore.initializeFromServerData(data.settlement.id, {
	current: data.settlement.population?.current || 0,
	capacity: populationCapacity,
	// ... other fields
});
```

**Files to Change**:
- `client/src/routes/(protected)/game/settlements/[id]/+page.server.ts` - Calculate capacity server-side
- `client/src/routes/(protected)/game/settlements/[id]/+page.svelte` - Remove manual calculation
- `server/src/api/routes/structures.ts` - Return updated capacity after builds

---

## Testing Plan

### Manual Testing Checklist

**Issue #1: Socket Progress**
- [ ] Build a structure with 60+ second build time
- [ ] Watch construction queue panel - progress bar should update every second
- [ ] Time remaining should count down in real-time
- [ ] Progress should match server calculation

**Issue #2: Insufficient Resources**
- [ ] Try to build expensive structure (Town Hall) without resources
- [ ] Should see toast notification: "Insufficient Resources: wood: need 150 more, stone: need 100 more"
- [ ] Should NOT show generic "Failed to build" message

**Issue #3: Locked Slots**
- [ ] Queue extractor construction on a tile
- [ ] Navigate to tile slots panel
- [ ] Slot should show 🔒 icon with "Queued" label
- [ ] Slot should be disabled (can't click)
- [ ] After construction completes, slot should show built extractor

**Issue #4: Demolish Modal**
- [ ] Click "Demolish" on any building
- [ ] Should see in-game modal (not browser confirm)
- [ ] Modal should have styled buttons
- [ ] "Cancel" should close modal without action
- [ ] "Demolish" should remove building and close modal

**Issue #5: Population Capacity**
- [ ] Create new settlement (should have 10 capacity)
- [ ] Build 1 Tent (+2 capacity) → Total 12
- [ ] Build 1 House (+5 capacity) → Total 17
- [ ] Build another House (+5 capacity) → Total 22
- [ ] Demolish House (-5 capacity) → Total 17
- [ ] Population panel should always show correct capacity

### E2E Test Coverage

Create new test file: `client/tests/e2e/construction-queue-feedback.spec.ts`

```typescript
test('should show socket progress updates every second', async ({ page }) => {
	// Build structure with 60s build time
	// Wait 3 seconds
	// Verify progress increased and time decreased
});

test('should show toast when insufficient resources', async ({ page }) => {
	// Try to build Town Hall without resources
	// Wait for toast to appear
	// Verify toast contains "Insufficient Resources"
});

test('should show locked slot when extractor queued', async ({ page }) => {
	// Queue extractor for slot 1
	// Navigate to tile slots
	// Verify slot 1 shows "Queued" and is disabled
});

test('should show modal when demolishing', async ({ page }) => {
	// Build structure
	// Click demolish
	// Verify modal appears (not browser alert)
	// Click cancel → modal closes, structure remains
	// Click demolish again → modal appears
	// Click confirm → structure removed
});

test('should calculate population capacity correctly', async ({ page }) => {
	// Get initial capacity (10)
	// Build Tent → verify capacity is 12
	// Build House → verify capacity is 17
	// Demolish Tent → verify capacity is 15
});
```

---

## Implementation Order

1. ✅ **Issue #1** - Socket progress (server-side, affects all clients)
2. ✅ **Issue #5** - Population calculation (data integrity, foundational)
3. ✅ **Issue #2** - Insufficient resources toast (quick win, user feedback)
4. ✅ **Issue #3** - Locked slots (visual feedback, prevents bugs)
5. ✅ **Issue #4** - Demolish modal (UI polish, best practices)
6. ✅ Write E2E tests for all fixes

---

## Files to Modify

### Server
- `server/src/game/construction-queue-processor.ts` - Add `broadcastConstructionProgress()`
- `server/src/game/game-loop.ts` - Call progress broadcast
- `server/src/api/routes/structures.ts` - Return queued constructions, updated capacity

### Client
- `client/src/lib/components/ui/ConfirmModal.svelte` - NEW
- `client/src/lib/components/game/MobileBuildMenu.svelte` - Add toast
- `client/src/lib/components/game/SettlementDashboard.svelte` - Replace confirm() with modal
- `client/src/lib/components/game/panels/BuildingsListPanel.svelte` - Use ConfirmModal
- `client/src/lib/components/game/panels/ExtractorsGridPanel.svelte` - Use ConfirmModal
- `client/src/lib/components/game/panels/TileSlotsPanel.svelte` - Show locked slots
- `client/src/routes/(protected)/game/settlements/[id]/+page.server.ts` - Calculate capacity, load queued
- `client/src/routes/(protected)/game/settlements/[id]/+page.svelte` - Remove manual capacity calc
- `client/tests/e2e/construction-queue-feedback.spec.ts` - NEW

---

## Completion Criteria

- [ ] All 5 issues resolved
- [ ] Manual testing checklist completed
- [ ] E2E tests passing
- [ ] No regressions in existing construction-queue.spec.ts
- [ ] Documentation updated
