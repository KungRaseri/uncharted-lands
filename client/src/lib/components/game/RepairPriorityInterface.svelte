<script lang="ts">
	import StructureHealthBar from './StructureHealthBar.svelte';
	import { disasterStore } from '$lib/stores/game/disaster.svelte';

	interface DamagedStructure {
		id: string;
		name: string;
		type: string;
		health: number;
		repairCost: {
			wood: number;
			stone: number;
			ore: number;
		};
		priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
	}

	// Mock data for now - in real implementation, this would come from the game state
	let damagedStructures = $state<DamagedStructure[]>([
		{
			id: '1',
			name: 'Farm #1',
			type: 'FARM',
			health: 15,
			repairCost: { wood: 150, stone: 75, ore: 0 },
			priority: 'CRITICAL'
		},
		{
			id: '2',
			name: 'Hospital',
			type: 'HOSPITAL',
			health: 45,
			repairCost: { wood: 250, stone: 125, ore: 50 },
			priority: 'HIGH'
		}
	]);

	const emergencyActive = $derived(disasterStore.emergencyRepairWindowActive);
	const emergencyTime = $derived(disasterStore.emergencyRepairTimeFormatted);

	let selectedStructures = $state(new Set<string>());
	let sortBy = $state<'health' | 'priority'>('priority');
	let shelterActivated = $state(false);
	let repairSuccess = $state(false);
	let casualtyCount = $state(0);

	const sortedStructures = $derived(() => {
		return [...damagedStructures].sort((a, b) => {
			if (sortBy === 'health') {
				return a.health - b.health;
			}
			// Priority sorting
			const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
			return priorityOrder[a.priority] - priorityOrder[b.priority];
		});
	});

	function toggleSelection(id: string) {
		if (selectedStructures.has(id)) {
			selectedStructures.delete(id);
		} else {
			selectedStructures.add(id);
		}
		selectedStructures = new Set(selectedStructures); // Trigger reactivity
	}

	function selectAll() {
		selectedStructures = new Set(damagedStructures.map((s) => s.id));
	}

	function deselectAll() {
		selectedStructures = new Set();
	}

	const totalCost = $derived(() => {
		const selected = damagedStructures.filter((s) => selectedStructures.has(s.id));
		return selected.reduce(
			(acc, s) => ({
				wood: acc.wood + s.repairCost.wood,
				stone: acc.stone + s.repairCost.stone,
				ore: acc.ore + s.repairCost.ore
			}),
			{ wood: 0, stone: 0, ore: 0 }
		);
	});

	function repairSelected() {
		console.log('[REPAIR] Repairing', selectedStructures.size, 'structures');
		// TODO: Implement repair action
		repairSuccess = true;
		setTimeout(() => {
			repairSuccess = false;
		}, 3000);
	}

	function activateShelter() {
		console.log('[SHELTER] Activating emergency shelter');
		shelterActivated = true;
		// TODO: Implement shelter activation
	}
</script>

<div class="card p-6">
	<div class="flex justify-between items-center mb-4">
		<h3 class="h3">Structure Repair Manager</h3>
		{#if emergencyActive}
			<div class="badge variant-filled-warning">
				Emergency Discount: {emergencyTime}
			</div>
		{/if}
	</div>

	<!-- Controls -->
	<div class="flex gap-4 mb-4">
		<div class="flex gap-2">
			<label class="label">
				<span class="text-sm">Sort by:</span>
				<select class="select" bind:value={sortBy}>
					<option value="priority">Priority</option>
					<option value="health">Health</option>
				</select>
			</label>
		</div>
		{#if emergencyActive}
			<div class="badge variant-filled-warning" data-testid="emergency-repair-discount">
				Emergency Discount: {emergencyTime}
			</div>
		{/if}
		<div class="flex gap-2 ml-auto">
			<button type="button" onclick={selectAll} class="btn btn-sm variant-ghost-surface">
				Select All
			</button>
			<button type="button" onclick={deselectAll} class="btn btn-sm variant-ghost-surface">
				Deselect All
			</button>
		</div>
	</div>

	<!-- Emergency Shelter Section -->
	<div class="card p-4 mb-4 bg-warning-500/10 border border-warning-500">
		<h4 class="h4 mb-2">Emergency Shelter</h4>
		{#if !shelterActivated}
			<button
				type="button"
				onclick={activateShelter}
				class="btn variant-filled-warning"
				data-testid="activate-shelter-btn"
			>
				Activate Emergency Shelter
			</button>
		{:else}
			<div class="flex items-center gap-2">
				<div class="badge variant-filled-success" data-testid="shelter-activated">
					✓ Shelter Active
				</div>
				{#if casualtyCount > 0}
					<div class="text-error-400">
						Casualties: <span data-testid="casualty-count">{casualtyCount}</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Structure List -->
	<div class="space-y-2 mb-4 max-h-96 overflow-y-auto">
		{#each sortedStructures() as structure}
			<div class="card p-4 flex items-center gap-4">
				<input
					type="checkbox"
					checked={selectedStructures.has(structure.id)}
					onchange={() => toggleSelection(structure.id)}
					class="checkbox"
				/>

				<div class="flex-1">
					<div class="flex justify-between items-center mb-2">
						<div>
							<h4 class="font-bold">{structure.name}</h4>
							<p class="text-xs text-surface-600-300-token">{structure.type}</p>
						</div>
						<span
							class="badge"
							class:variant-filled-error={structure.priority === 'CRITICAL'}
							class:variant-filled-warning={structure.priority === 'HIGH'}
							class:variant-filled-surface={structure.priority === 'MEDIUM' ||
								structure.priority === 'LOW'}
						>
							{structure.priority}
						</span>
					</div>

					<StructureHealthBar health={structure.health} size="sm" />

					<div class="mt-2 text-xs flex gap-4">
						<span>🪵 {structure.repairCost.wood}</span>
						<span>🪨 {structure.repairCost.stone}</span>
						{#if structure.repairCost.ore > 0}
							<span>⛏️ {structure.repairCost.ore}</span>
						{/if}
						{#if emergencyActive}
							<span class="text-yellow-600 font-bold">
								(50% OFF: {Math.floor(structure.repairCost.wood / 2)}W
								{Math.floor(structure.repairCost.stone / 2)}S
								{Math.floor(structure.repairCost.ore / 2)}O)
							</span>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Summary -->
	<div class="card p-4 bg-surface-200-700-token mb-4">
		<div class="flex justify-between items-center">
			<div>
				<p class="text-sm font-medium">Selected: {selectedStructures.size} structures</p>
				<p class="text-xs text-surface-600-300-token">
					Total Cost: 🪵 {emergencyActive ? Math.floor(totalCost().wood / 2) : totalCost().wood}
					| 🪨 {emergencyActive ? Math.floor(totalCost().stone / 2) : totalCost().stone}
					| ⛏️ {emergencyActive ? Math.floor(totalCost().ore / 2) : totalCost().ore}
				</p>
			</div>
			<button
				type="button"
				onclick={repairSelected}
				disabled={selectedStructures.size === 0}
				class="btn variant-filled-primary"
				data-testid={emergencyActive ? 'emergency-repair-btn' : 'repair-btn'}
			>
				{emergencyActive ? 'Repair Selected (Emergency)' : 'Repair Selected'}
			</button>
			{#if repairSuccess}
				<div class="badge variant-filled-success mt-2" data-testid="repair-success">
					✓ Repairs completed successfully!
				</div>
			{/if}
		</div>
	</div>
</div>
