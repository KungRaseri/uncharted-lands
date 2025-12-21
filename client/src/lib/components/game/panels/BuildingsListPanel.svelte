<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { logger } from '$lib/utils/logger';
	import type { StructureMetadata } from '$lib/api/structures';

	/**
	 * BuildingsListPanel Component
	 *
	 * Displays settlement buildings in a vertical list with:
	 * - Structure name, level, health
	 * - Action buttons (upgrade, repair, demolish)
	 * - Modifiers tooltip
	 * - Accessibility features (keyboard navigation, ARIA)
	 * - Building Area System: Area cost badges and tooltips
	 */

	interface StructureModifier {
		id: string;
		name: string;
		description: string;
		value: number;
	}

	interface Building {
		id: string;
		structureId: string;
		name: string;
		description: string;
		level: number;
		maxLevel: number;
		health: number;
		extractorType: string | null; // ✅ Flattened from structure.extractorType
		buildingType: string | null; // ✅ Flattened from structure.buildingType
		category: string; // ✅ Added from API response
		modifiers: StructureModifier[];
	}

	interface Props {
		buildings: Building[];
		settlementId: string;
		structures?: StructureMetadata[]; // Optional: structure metadata for area info
		onBuild?: () => void;
		onUpgrade?: (buildingId: string) => void;
		onRepair?: (buildingId: string) => void;
		onDemolish?: (buildingId: string) => void;
	}

	let {
		buildings = [],
		settlementId,
		structures = [],
		onBuild,
		onUpgrade,
		onRepair,
		onDemolish
	}: Props = $props();

	// Helper to get structure metadata for a building
	function getStructureMetadata(building: Building): StructureMetadata | undefined {
		return structures.find((s) => s.id === building.structureId);
	}

	// ✅ DEBUG: Log when component renders and receives buildings
	$effect(() => {
		logger.debug('[BuildingsListPanel] ==== COMPONENT RENDER ====');
		logger.debug('[BuildingsListPanel] Buildings.length:', { length: buildings.length });
		if (buildings.length > 0) {
			logger.debug('[BuildingsListPanel] Building names:', {
				names: buildings.map((b) => b.name)
			});
		}
		logger.debug('[BuildingsListPanel] ================');
	});

	// Expanded building IDs for showing modifiers
	let expandedBuildings = $state<Set<string>>(new Set());

	function toggleExpanded(buildingId: string) {
		if (expandedBuildings.has(buildingId)) {
			expandedBuildings.delete(buildingId);
		} else {
			expandedBuildings.add(buildingId);
		}
		expandedBuildings = new Set(expandedBuildings); // Trigger reactivity
	}

	function getHealthColor(health: number): string {
		if (health >= 80) return 'text-success-500';
		if (health >= 60) return 'text-warning-500';
		if (health >= 40) return 'text-warning-700';
		return 'text-error-500';
	}

	function getHealthLabel(health: number): string {
		if (health >= 95) return 'Pristine';
		if (health >= 80) return 'Excellent';
		if (health >= 60) return 'Good';
		if (health >= 40) return 'Damaged';
		if (health >= 20) return 'Poor';
		if (health > 0) return 'Critical';
		return 'Destroyed';
	}

	function canUpgrade(building: Building): boolean {
		return building.level < building.maxLevel && building.health > 0;
	}

	function needsRepair(building: Building): boolean {
		return building.health < 100;
	}

	function handleKeydown(event: KeyboardEvent, action: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			action();
		}
	}
</script>

<section class="card variant-glass-surface p-4 space-y-4" aria-labelledby="buildings-heading">
	<header class="flex items-center justify-between">
		<h3 id="buildings-heading" class="h4">
			Buildings ({buildings.length})
		</h3>
		<button
			onclick={() => onBuild?.()}
			data-testid="build-structure-btn"
			class="btn variant-filled-primary btn-sm"
			aria-label="Build new structure"
		>
			<span aria-hidden="true">🏗️</span>
			Build
		</button>
	</header>

	{#if buildings.length === 0}
		<div class="text-center py-8 text-surface-500-400-token" role="status" aria-live="polite">
			<p class="text-lg">No buildings yet</p>
			<p class="text-sm">Click Build to add your first building</p>
		</div>
	{:else}
		<ul class="space-y-3" role="list">
			{#each buildings as building (building.id)}
				{@const metadata = getStructureMetadata(building)}
				<li
					data-testid="structure"
					data-structure-id={building.buildingType ||
						building.extractorType ||
						building.structureId}
					data-structure-type={building.buildingType || building.extractorType}
					class="card variant-soft p-4 space-y-2"
					transition:slide={{ duration: 300, easing: quintOut }}
				>
					<!-- Building Header -->
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<h4 class="font-semibold text-lg truncate">
									{building.name}
									<span class="text-sm text-surface-600-300-token ml-2">
										Level {building.level}/{building.maxLevel}
									</span>
								</h4>
								{#if metadata?.areaCost && metadata.areaCost > 0}
									<span
										class="text-xs px-2 py-0.5 rounded-full bg-primary-200 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-medium"
										title="Building area cost: {metadata.areaCost}"
									>
										📐 {metadata.areaCost}
									</span>
								{/if}
								{#if metadata?.unique}
									<span
										class="text-xs px-2 py-0.5 rounded-full bg-warning-200 dark:bg-warning-900 text-warning-700 dark:text-warning-300 font-medium"
										title="Unique building - only one per settlement"
									>
										⭐
									</span>
								{/if}
							</div>
							<p class="text-sm text-surface-600-300-token mt-1">
								{building.description}
							</p>
						</div>

						<!-- Health Badge -->
						<div
							class="flex items-center gap-2 shrink-0"
							title="Structure health: {building.health}%"
						>
							<span class={getHealthColor(building.health)} data-testid="health">
								{building.health}%
							</span>
							<span class="text-xs text-surface-500-400-token">
								{getHealthLabel(building.health)}
							</span>
						</div>
					</div>

					<!-- Progress Bar (Health) -->
					<div class="w-full bg-surface-300-600-token rounded-full h-2">
						<div
							class="h-2 rounded-full transition-all duration-300 {getHealthColor(
								building.health
							).replace('text-', 'bg-')}"
							style="width: {building.health}%"
							role="progressbar"
							aria-valuenow={building.health}
							aria-valuemin={0}
							aria-valuemax={100}
							aria-label="Structure health: {building.health}%"
						></div>
					</div>

					<!-- Modifiers Toggle -->
					{#if building.modifiers.length > 0}
						<button
							type="button"
							class="btn btn-sm variant-ghost-surface w-full justify-between"
							onclick={() => toggleExpanded(building.id)}
							onkeydown={(e) => handleKeydown(e, () => toggleExpanded(building.id))}
							aria-expanded={expandedBuildings.has(building.id)}
							aria-controls="modifiers-{building.id}"
						>
							<span>Modifiers ({building.modifiers.length})</span>
							<span
								class="transition-transform duration-200 {expandedBuildings.has(
									building.id
								)
									? 'rotate-180'
									: ''}"
							>
								▼
							</span>
						</button>

						{#if expandedBuildings.has(building.id)}
							<div
								id="modifiers-{building.id}"
								class="card variant-filled-surface p-3 space-y-2"
								transition:slide={{ duration: 200 }}
								role="region"
								aria-label="Building modifiers"
							>
								{#each building.modifiers as modifier (modifier.id)}
									<div class="flex items-start justify-between gap-2">
										<div class="flex-1 min-w-0">
											<p class="font-medium text-sm">{modifier.name}</p>
											<p class="text-xs text-surface-600-300-token">
												{modifier.description}
											</p>
										</div>
										<span class="text-sm font-semibold shrink-0">
											{modifier.value > 0 ? '+' : ''}
											{building.level * modifier.value}
											<span class="text-xs font-semibold shrink-0">
												({modifier.value} / Level)
											</span>
										</span>
									</div>
								{/each}
							</div>
						{/if}
					{/if}

					<!-- Action Buttons -->
					<div class="flex flex-wrap gap-2 pt-2">
						{#if canUpgrade(building)}
							<button
								type="button"
								class="btn btn-sm variant-filled-primary"
								onclick={() => onUpgrade?.(building.id)}
								aria-label="Upgrade {building.name} to level {building.level + 1}"
							>
								Upgrade to Level {building.level + 1}
							</button>
						{:else if building.level === building.maxLevel}
							<span class="text-sm text-surface-500-400-token">
								Max level reached
							</span>
						{/if}

						{#if needsRepair(building)}
							<button
								type="button"
								class="btn btn-sm variant-filled-warning"
								onclick={() => onRepair?.(building.id)}
								aria-label="Repair {building.name} ({100 -
									building.health}% damage)"
							>
								Repair ({100 - building.health}% damage)
							</button>
						{/if}

						<button
							type="button"
							class="btn btn-sm variant-ghost-error"
							onclick={() => onDemolish?.(building.id)}
							aria-label="Demolish {building.name}"
						>
							Demolish
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	/* Ensure text colors work in both light and dark modes */
	:global(.dark) .text-success-500 {
		color: rgb(var(--color-success-500));
	}

	:global(.dark) .text-warning-500,
	:global(.dark) .text-warning-700 {
		color: rgb(var(--color-warning-500));
	}

	:global(.dark) .text-error-500 {
		color: rgb(var(--color-error-500));
	}
</style>
