<script lang="ts">
	/**
	 * Structure List Panel Component
	 * Displays all buildings (category='BUILDING') for the settlement
	 * Supports multi-instance buildings with instance numbering
	 * WCAG 2.1 AA Compliant
	 */

	interface BuildingStructure {
		id: string;
		structureId: string; // e.g., 'HOUSE', 'STORAGE', 'WORKSHOP'
		settlementId: string;
		level: number; // 1-10
		health: number; // 0-100
		category: 'BUILDING';
		tileId: null; // Buildings have no tile association
		slotPosition: null; // Buildings have no slot position
		populationAssigned?: number;
	}

	interface StructureDefinition {
		id: string;
		name: string;
		displayName: string;
		description: string;
		category: 'BUILDING' | 'EXTRACTOR';
		tier: 1 | 2 | 3 | 4 | 5;
		unique?: boolean; // If true, only one instance allowed
	}

	interface Props {
		settlementId: string;
		buildings?: BuildingStructure[];
		structureDefinitions?: Record<string, StructureDefinition>;
		onUpgradeBuilding?: (building: BuildingStructure) => void;
		onRepairBuilding?: (building: BuildingStructure) => void;
		onViewBuilding?: (building: BuildingStructure) => void;
		onDemolishBuilding?: (building: BuildingStructure) => void;
	}

	let {
		settlementId,
		buildings = [],
		structureDefinitions = {},
		onUpgradeBuilding,
		onRepairBuilding,
		onViewBuilding,
		onDemolishBuilding
	}: Props = $props();

	// Health level configuration
	const healthLevelConfig = {
		pristine: { min: 95, label: 'Pristine', color: 'var(--success-500)' },
		excellent: { min: 80, label: 'Excellent', color: 'var(--success-400)' },
		good: { min: 60, label: 'Good', color: 'var(--primary-500)' },
		damaged: { min: 40, label: 'Damaged', color: 'var(--warning-500)' },
		poor: { min: 20, label: 'Poor', color: 'var(--warning-700)' },
		critical: { min: 1, label: 'Critical', color: 'var(--error-600)' },
		destroyed: { min: 0, label: 'Destroyed', color: 'var(--surface-400)' }
	} as const;

	// Structure type icons (can be customized per structure type)
	const structureIcons: Record<string, string> = {
		TENT: '⛺',
		HOUSE: '🏠',
		STORAGE: '📦',
		WAREHOUSE: '🏢',
		WORKSHOP: '🔧',
		MARKETPLACE: '🏪',
		TOWN_HALL: '🏛️',
		BARRACKS: '⚔️',
		WALL: '🛡️',
		WATCHTOWER: '🗼',
		HOSPITAL: '🏥',
		RESEARCH_LAB: '🔬',
		LIBRARY: '📚'
	};

	/**
	 * Group buildings by structureId and count instances
	 */
	const buildingGroups = $derived(() => {
		const groups = new Map<string, BuildingStructure[]>();

		buildings.forEach((building) => {
			const existing = groups.get(building.structureId) || [];
			existing.push(building);
			groups.set(building.structureId, existing);
		});

		return groups;
	});

	/**
	 * Get sorted list of building groups for display
	 * Sorted by: tier (ascending), then name (alphabetical)
	 */
	const sortedBuildingGroups = $derived(() => {
		const groupsArray = Array.from(buildingGroups().entries()).map(
			([structureId, instances]) => {
				const definition = structureDefinitions[structureId] || {
					id: structureId,
					name: structureId,
					displayName: structureId,
					description: '',
					category: 'BUILDING' as const,
					tier: 1 as const,
					unique: false
				};

				return {
					structureId,
					definition,
					instances: instances.sort((a, b) => b.level - a.level) // Sort by level descending
				};
			}
		);

		return groupsArray.sort((a, b) => {
			if (a.definition.tier !== b.definition.tier) {
				return a.definition.tier - b.definition.tier;
			}
			return a.definition.displayName.localeCompare(b.definition.displayName);
		});
	});

	/**
	 * Get instance number for a building (e.g., House #1, House #2)
	 */
	function getInstanceNumber(building: BuildingStructure): number {
		const instances = buildingGroups().get(building.structureId) || [];
		const sorted = [...instances].sort((a, b) => {
			// Sort by creation order (assuming id is chronological)
			return a.id.localeCompare(b.id);
		});
		return sorted.findIndex((b) => b.id === building.id) + 1;
	}

	/**
	 * Get health level classification
	 */
	function getHealthLevel(health: number): keyof typeof healthLevelConfig {
		if (health >= 95) return 'pristine';
		if (health >= 80) return 'excellent';
		if (health >= 60) return 'good';
		if (health >= 40) return 'damaged';
		if (health >= 20) return 'poor';
		if (health >= 1) return 'critical';
		return 'destroyed';
	}

	/**
	 * Format health percentage
	 */
	function formatHealth(health: number): string {
		return `${Math.round(health)}%`;
	}

	/**
	 * Get structure icon
	 */
	function getStructureIcon(structureId: string): string {
		return structureIcons[structureId] || '🏗️';
	}

	/**
	 * Check if building needs repair (health < 100%)
	 */
	function needsRepair(health: number): boolean {
		return health < 100;
	}

	/**
	 * Check if building is destroyed (health = 0%)
	 */
	function isDestroyed(health: number): boolean {
		return health === 0;
	}

	/**
	 * Handle building action click
	 */
	function handleBuildingClick(building: BuildingStructure) {
		if (onViewBuilding) {
			onViewBuilding(building);
		}
	}

	/**
	 * Handle upgrade button click
	 */
	function handleUpgradeClick(event: MouseEvent, building: BuildingStructure) {
		event.stopPropagation();
		if (onUpgradeBuilding) {
			onUpgradeBuilding(building);
		}
	}

	/**
	 * Handle repair button click
	 */
	function handleRepairClick(event: MouseEvent, building: BuildingStructure) {
		event.stopPropagation();
		if (onRepairBuilding) {
			onRepairBuilding(building);
		}
	}

	/**
	 * Handle demolish button click
	 */
	function handleDemolishClick(event: MouseEvent, building: BuildingStructure) {
		event.stopPropagation();
		if (onDemolishBuilding) {
			onDemolishBuilding(building);
		}
	}
</script>

<section
	class="bg-surface-50 dark:bg-surface-900 rounded-lg overflow-hidden h-full flex flex-col"
	aria-labelledby="structure-list-title"
>
	<!-- Header -->
	<header class="p-4 border-b border-surface-200 dark:border-surface-700">
		<h2
			id="structure-list-title"
			class="text-lg font-semibold text-surface-900 dark:text-surface-100"
		>
			Settlement Buildings
		</h2>
		<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
			{buildings.length}
			{buildings.length === 1 ? 'building' : 'buildings'} constructed
		</p>
	</header>

	<!-- Buildings List -->
	<div class="flex-1 overflow-y-auto p-4">
		{#if sortedBuildingGroups().length === 0}
			<div class="text-center py-8 text-surface-500 dark:text-surface-400">
				<p class="text-4xl mb-2">🏗️</p>
				<p class="font-medium">No buildings yet</p>
				<p class="text-sm mt-1">Start by building a tent or house for your settlers</p>
			</div>
		{:else}
			<ul class="space-y-3 list-none p-0 m-0" role="list">
				{#each sortedBuildingGroups() as group (group.structureId)}
					{@const definition = group.definition}
					{@const instances = group.instances}
					{@const isUnique = definition.unique === true}
					{@const hasMultipleInstances = instances.length > 1}

					<!-- Group Header (if multiple instances) -->
					{#if hasMultipleInstances}
						<li role="listitem">
							<div
								class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2"
							>
								{getStructureIcon(group.structureId)}
								{definition.displayName}
								{#if isUnique}
									<span
										class="text-xs bg-warning-100 dark:bg-warning-900 text-warning-700 dark:text-warning-300 px-2 py-0.5 rounded ml-2"
									>
										[UNIQUE]
									</span>
								{/if}
							</div>
						</li>
					{/if}

					<!-- Individual Building Instances -->
					{#each instances as building (building.id)}
						{@const healthLevel = getHealthLevel(building.health)}
						{@const healthConfig = healthLevelConfig[healthLevel]}
						{@const instanceNum = getInstanceNumber(building)}
						{@const showInstanceNum = hasMultipleInstances && !isUnique}

						<li role="listitem">
							<div
								onclick={() => handleBuildingClick(building)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleBuildingClick(building);
									}
								}}
								role="button"
								tabindex="0"
								class="w-full text-left p-3 rounded-lg border border-surface-200 dark:border-surface-700 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer"
								aria-label="{definition.displayName} {showInstanceNum
									? `instance ${instanceNum}`
									: ''} level {building.level} health {formatHealth(
									building.health
								)}"
							>
								<!-- Building Header Row -->
								<div class="flex items-start justify-between gap-3 mb-2">
									<div class="flex items-center gap-2 flex-1 min-w-0">
										<!-- Icon -->
										<span class="text-2xl shrink-0" aria-hidden="true">
											{getStructureIcon(group.structureId)}
										</span>

										<!-- Name and Instance -->
										<div class="flex-1 min-w-0">
											<div
												class="font-medium text-surface-900 dark:text-surface-100 truncate"
											>
												{definition.displayName}
												{#if showInstanceNum}
													<span
														class="text-surface-600 dark:text-surface-400"
													>
														#{instanceNum}
													</span>
												{/if}
												{#if isUnique && !hasMultipleInstances}
													<span
														class="text-xs bg-warning-100 dark:bg-warning-900 text-warning-700 dark:text-warning-300 px-2 py-0.5 rounded ml-2"
													>
														[UNIQUE]
													</span>
												{/if}
											</div>
											<div
												class="text-sm text-surface-600 dark:text-surface-400"
											>
												Level {building.level}
												{#if building.populationAssigned !== undefined && building.populationAssigned > 0}
													• {building.populationAssigned} workers
												{/if}
											</div>
										</div>
									</div>
								</div>

								<!-- Health Bar -->
								<div class="mb-2">
									<div class="flex items-center justify-between text-xs mb-1">
										<span class="text-surface-600 dark:text-surface-400"
											>Health</span
										>
										<span
											class="font-medium tabular-nums"
											style:color={healthConfig.color}
										>
											{formatHealth(building.health)} ({healthConfig.label})
										</span>
									</div>
									<div
										class="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden"
										role="meter"
										aria-label="Building health"
										aria-valuenow={building.health}
										aria-valuemin={0}
										aria-valuemax={100}
									>
										<div
											class="h-full transition-all duration-300"
											style:width="{building.health}%"
											style:background-color={healthConfig.color}
										></div>
									</div>
								</div>

								<!-- Action Buttons Row -->
								<div class="flex items-center gap-2 mt-3">
									{#if !isDestroyed(building.health)}
										<!-- Upgrade Button -->
										{#if building.level < 10}
											<button
												type="button"
												onclick={(e) => handleUpgradeClick(e, building)}
												class="flex-1 px-3 py-1.5 text-xs font-medium bg-primary-500 hover:bg-primary-600 text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
												aria-label="Upgrade to level {building.level + 1}"
											>
												⬆️ Upgrade
											</button>
										{/if}

										<!-- Repair Button -->
										{#if needsRepair(building.health)}
											<button
												type="button"
												onclick={(e) => handleRepairClick(e, building)}
												class="flex-1 px-3 py-1.5 text-xs font-medium bg-warning-500 hover:bg-warning-600 text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-warning-500 focus:ring-offset-2"
												aria-label="Repair building"
											>
												🔧 Repair
											</button>
										{/if}
									{/if}

									<!-- Demolish Button -->
									<button
										type="button"
										onclick={(e) => handleDemolishClick(e, building)}
										class="px-3 py-1.5 text-xs font-medium bg-error-500 hover:bg-error-600 text-white rounded transition-colors focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2"
										aria-label="Demolish building"
									>
										💥 Demolish
									</button>
								</div>
							</div>
						</li>
					{/each}
				{/each}
			</ul>
		{/if}
	</div>

	<!-- Help Text -->
	<footer class="p-4 border-t border-surface-200 dark:border-surface-700">
		<p class="text-xs text-surface-600 dark:text-surface-400">
			Click a building to view details. Use upgrade/repair/demolish buttons to manage your
			structures.
		</p>
	</footer>
</section>
