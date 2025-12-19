<script lang="ts">
	import type { PageData } from './$types';
	import { logger } from '$lib/utils/logger';
	import {
		Zap,
		CloudLightning,
		Wind,
		Flame,
		Droplets,
		AlertTriangle,
		Send,
		RefreshCw,
		Database,
		Settings
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	// Tab state
	let activeTab = $state<'disasters' | 'events' | 'data' | 'system'>('disasters');

	// Disaster trigger state
	let selectedDisasterType = $state('EARTHQUAKE');
	let selectedWorldId = $state('');
	let selectedRegionIds = $state<string[]>([]);
	let severityLevel = $state(3);
	let isTriggeringDisaster = $state(false);
	let disasterResult = $state<{ success: boolean; message: string } | null>(null);

	// Computed: regions for selected world
	const availableRegions = $derived(
		selectedWorldId
			? data.regions.filter((r: { worldId: string }) => r.worldId === selectedWorldId)
			: []
	);

	// Disaster types with icons and descriptions
	const disasterTypes = [
		{
			type: 'EARTHQUAKE',
			label: 'Earthquake',
			icon: AlertTriangle,
			description: 'Ground shaking causing structural damage',
			color: 'text-error-500'
		},
		{
			type: 'WILDFIRE',
			label: 'Wildfire',
			icon: Flame,
			description: 'Uncontrolled fire spreading through the settlement',
			color: 'text-warning-500'
		},
		{
			type: 'DROUGHT',
			label: 'Drought',
			icon: Wind,
			description: 'Extended period of water scarcity',
			color: 'text-tertiary-500'
		},
		{
			type: 'FLOOD',
			label: 'Flood',
			icon: Droplets,
			description: 'Water overflow damaging structures and crops',
			color: 'text-primary-500'
		},
		{
			type: 'STORM',
			label: 'Storm',
			icon: CloudLightning,
			description: 'Severe weather with high winds and rain',
			color: 'text-secondary-500'
		}
	];

	function toggleRegion(regionId: string) {
		if (selectedRegionIds.includes(regionId)) {
			selectedRegionIds = selectedRegionIds.filter((id) => id !== regionId);
		} else {
			selectedRegionIds = [...selectedRegionIds, regionId];
		}
	}

	function selectAllRegions() {
		if (selectedRegionIds.length === availableRegions.length) {
			selectedRegionIds = [];
		} else {
			selectedRegionIds = availableRegions.map((r: { id: string }) => r.id);
		}
	}

	async function triggerDisaster() {
		if (!selectedWorldId) {
			disasterResult = { success: false, message: 'Please select a world' };
			return;
		}

		if (selectedRegionIds.length === 0) {
			disasterResult = { success: false, message: 'Please select at least one region' };
			return;
		}

		isTriggeringDisaster = true;
		disasterResult = null;

		try {
			logger.debug('[ADMIN UTILITIES] Triggering disaster:', {
				type: selectedDisasterType,
				worldId: selectedWorldId,
				regionIds: selectedRegionIds,
				severity: severityLevel
			});

			const response = await fetch('/api/admin/disasters/trigger', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					worldId: selectedWorldId,
					regionIds: selectedRegionIds,
					disasterType: selectedDisasterType,
					severity: severityLevel
				}),
				credentials: 'include'
			});

			const result = await response.json();

			if (response.ok && result.success) {
				disasterResult = {
					success: true,
					message: `Successfully triggered ${selectedDisasterType} disaster affecting ${selectedRegionIds.length} region(s)!`
				};
				logger.info('[ADMIN UTILITIES] Disaster triggered successfully:', { result });
			} else {
				disasterResult = {
					success: false,
					message: result.error || 'Failed to trigger disaster'
				};
				logger.error('[ADMIN UTILITIES] Failed to trigger disaster:', { result });
			}
		} catch (error) {
			disasterResult = {
				success: false,
				message: error instanceof Error ? error.message : 'Network error occurred'
			};
			logger.error('[ADMIN UTILITIES] Error triggering disaster:', error);
		} finally {
			isTriggeringDisaster = false;
		}
	}

	function clearResult() {
		disasterResult = null;
	}
</script>

<svelte:head>
	<title>Admin Utilities | Uncharted Lands</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-center gap-3">
			<div
				class="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center"
			>
				<Zap size={28} class="text-primary-500" />
			</div>
			<div>
				<h1 class="text-3xl font-bold">Admin Utilities</h1>
				<p class="text-surface-600 dark:text-surface-400">
					Tools for testing, debugging, and managing game events
				</p>
			</div>
		</div>
	</div>

	<!-- Tab Navigation -->
	<div class="card preset-filled-surface-100-900">
		<div class="border-b border-surface-300 dark:border-surface-600">
			<div class="flex gap-2 px-4" role="tablist">
				<button
					class="px-4 py-3 font-semibold transition-colors relative {activeTab ===
					'disasters'
						? 'text-primary-500'
						: 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'}"
					onclick={() => {
						activeTab = 'disasters';
						clearResult();
					}}
					role="tab"
					aria-selected={activeTab === 'disasters'}
				>
					<span class="flex items-center gap-2">
						<AlertTriangle size={18} />
						Disaster Triggers
					</span>
					{#if activeTab === 'disasters'}
						<div
							class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full"
						></div>
					{/if}
				</button>

				<button
					class="px-4 py-3 font-semibold transition-colors relative {activeTab ===
					'events'
						? 'text-primary-500'
						: 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'}"
					onclick={() => {
						activeTab = 'events';
						clearResult();
					}}
					role="tab"
					aria-selected={activeTab === 'events'}
				>
					<span class="flex items-center gap-2">
						<Zap size={18} />
						Event Triggers
					</span>
					{#if activeTab === 'events'}
						<div
							class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full"
						></div>
					{/if}
				</button>

				<button
					class="px-4 py-3 font-semibold transition-colors relative {activeTab === 'data'
						? 'text-primary-500'
						: 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'}"
					onclick={() => {
						activeTab = 'data';
						clearResult();
					}}
					role="tab"
					aria-selected={activeTab === 'data'}
				>
					<span class="flex items-center gap-2">
						<Database size={18} />
						Data Tools
					</span>
					{#if activeTab === 'data'}
						<div
							class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full"
						></div>
					{/if}
				</button>

				<button
					class="px-4 py-3 font-semibold transition-colors relative {activeTab ===
					'system'
						? 'text-primary-500'
						: 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'}"
					onclick={() => {
						activeTab = 'system';
						clearResult();
					}}
					role="tab"
					aria-selected={activeTab === 'system'}
				>
					<span class="flex items-center gap-2">
						<Settings size={18} />
						System
					</span>
					{#if activeTab === 'system'}
						<div
							class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full"
						></div>
					{/if}
				</button>
		</div>
			{#if activeTab === 'disasters'}
				<!-- Disaster Triggers Tab -->
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold mb-2">Trigger Disasters</h2>
						<p class="text-surface-600 dark:text-surface-400 text-sm">
							Manually trigger disasters for testing and demonstration purposes. This will
							create real disaster events that affect regions and all settlements within them.
						</p>
					</div>

					<!-- Result Message -->
					{#if disasterResult}
						<div
							class="p-4 rounded-lg border {disasterResult.success
								? 'bg-success-500/10 border-success-500 text-success-700 dark:text-success-400'
								: 'bg-error-500/10 border-error-500 text-error-700 dark:text-error-400'}"
						>
							<div class="flex items-center justify-between">
								<p class="font-semibold">{disasterResult.message}</p>
								<button
									onclick={clearResult}
									class="btn btn-sm hover:bg-black/10 dark:hover:bg-white/10 rounded"
								>
									Dismiss
								</button>
							</div>
						</div>
					{/if}

					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<!-- Left Column: Configuration -->
						<div class="space-y-6">
							<!-- World Selection -->
							<div class="card preset-filled-surface-200-700 p-4">
								<label class="label">
									<span class="font-semibold mb-2 block">Target World *</span>
									<select
										bind:value={selectedWorldId}
										onchange={() => (selectedRegionIds = [])}
										class="select preset-filled-surface-100-800 w-full"
										required
									>
										<option value="">-- Select a world --</option>
										{#each data.worlds as world}
											<option value={world.id}>
												{world.name}
											</option>
										{/each}
									</select>
									<p class="text-xs text-surface-600 dark:text-surface-400 mt-2">
										Choose which world to target with the disaster
									</p>
								</label>
							</div>

							<!-- Region Selection -->
							{#if selectedWorldId}
								<div class="card preset-filled-surface-200-700 p-4">
									<div class="flex items-center justify-between mb-3">
										<span class="font-semibold">Target Regions *</span>
										<button
											type="button"
											onclick={selectAllRegions}
											class="btn btn-sm variant-ghost-surface text-xs"
										>
											{selectedRegionIds.length === availableRegions.length
												? 'Deselect All'
												: 'Select All'}
										</button>
									</div>
									{#if availableRegions.length > 0}
										<div class="space-y-2 max-h-48 overflow-y-auto">
											{#each availableRegions as region}
												<label class="flex items-center gap-2 p-2 rounded hover:bg-surface-300/50 dark:hover:bg-surface-700/50 cursor-pointer">
													<input
														type="checkbox"
														checked={selectedRegionIds.includes(
															region.id
														)}
														onchange={() => toggleRegion(region.id)}
														class="checkbox"
													/>
													<span class="text-sm">{region.name}</span>
												</label>
											{/each}
										</div>
										<p class="text-xs text-surface-600 dark:text-surface-400 mt-2">
											Selected: {selectedRegionIds.length} region(s)
										</p>
									{:else}
										<p class="text-sm text-surface-600 dark:text-surface-400">
											No regions available in this world
										</p>
									{/if}
								</div>
							{/if}

							<!-- Disaster Type Selection -->
							<div class="card preset-filled-surface-200-700 p-4">
								<label class="label">
									<span class="font-semibold mb-3 block">Disaster Type *</span>
									<div class="grid grid-cols-1 gap-2">
										{#each disasterTypes as disaster}
											{@const IconComponent = disaster.icon}
											<button
												type="button"
												class="text-left p-3 rounded-lg border-2 transition-all {selectedDisasterType ===
												disaster.type
													? 'border-primary-500 bg-primary-500/10'
													: 'border-surface-300 dark:border-surface-600 hover:border-surface-400 dark:hover:border-surface-500'}"
												onclick={() => (selectedDisasterType = disaster.type)}
											>
												<div class="flex items-start gap-3">
													<IconComponent
														size={20}
														class={disaster.color}
													/>
													<div class="flex-1">
														<div class="font-semibold">
															{disaster.label}
														</div>
														<div
															class="text-xs text-surface-600 dark:text-surface-400"
														>
															{disaster.description}
														</div>
													</div>
													{#if selectedDisasterType === disaster.type}
														<div
															class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
														>
															<div class="w-2 h-2 rounded-full bg-white"></div>
														</div>
													{/if}
												</div>
											</button>
										{/each}
									</div>
								</label>
							</div>

							<!-- Severity Level -->
							<div class="card preset-filled-surface-200-700 p-4">
								<label class="label">
									<span class="font-semibold mb-2 block"
										>Severity Level: {severityLevel}</span
									>
									<input
										type="range"
										bind:value={severityLevel}
										min="1"
										max="5"
										step="1"
										class="w-full"
									/>
									<div class="flex justify-between text-xs mt-2">
										<span class="text-success-500">1 - Minor</span>
										<span class="text-warning-500">3 - Moderate</span>
										<span class="text-error-500">5 - Catastrophic</span>
									</div>
									<p class="text-xs text-surface-600 dark:text-surface-400 mt-2">
										Higher severity causes more damage and longer duration
									</p>
								</label>
							</div>

							<!-- Trigger Button -->
							<button
								onclick={triggerDisaster}
								disabled={isTriggeringDisaster ||
									!selectedWorldId ||
									selectedRegionIds.length === 0}
								class="btn preset-filled-primary-500 w-full rounded-lg py-3 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{#if isTriggeringDisaster}
									<RefreshCw size={20} class="animate-spin" />
									<span>Triggering...</span>
								{:else}
									<Send size={20} />
									<span>Trigger Disaster</span>
								{/if}
							</button>
						</div>

						<!-- Right Column: Preview & Info -->
						<div class="space-y-6">
							<!-- Selected Disaster Preview -->
							<div class="card preset-filled-surface-200-700 p-4">
								<h3 class="font-semibold mb-3">Selected Configuration</h3>
								<div class="space-y-3">
									<div
										class="flex items-center justify-between py-2 border-b border-surface-300 dark:border-surface-600"
									>
										<span class="text-surface-600 dark:text-surface-400"
											>World:</span
										>
										<span class="font-semibold">
											{selectedWorldId
												? data.worlds.find(
														(w: { id: string; name: string }) =>
															w.id === selectedWorldId
													)?.name || 'Unknown'
												: 'Not selected'}
										</span>
									</div>
									<div
										class="flex items-center justify-between py-2 border-b border-surface-300 dark:border-surface-600"
									>
										<span class="text-surface-600 dark:text-surface-400"
											>Regions:</span
										>
										<span class="font-semibold">
											{selectedRegionIds.length > 0
												? `${selectedRegionIds.length} selected`
												: 'None selected'}
										</span>
									</div>
									<div
										class="flex items-center justify-between py-2 border-b border-surface-300 dark:border-surface-600"
									>
										<span class="text-surface-600 dark:text-surface-400"
											>Disaster Type:</span
										>
										<span class="font-semibold">{selectedDisasterType}</span>
									</div>
									<div class="flex items-center justify-between py-2">
										<span class="text-surface-600 dark:text-surface-400"
											>Severity:</span
										>
										<span
											class="font-semibold {severityLevel <= 2
												? 'text-success-500'
												: severityLevel <= 3
													? 'text-warning-500'
													: 'text-error-500'}"
										>
											Level {severityLevel}
										</span>
									</div>
								</div>
							</div>

							<!-- Warning Notice -->
							<div
								class="card bg-warning-500/10 border-2 border-warning-500 p-4"
							>
								<div class="flex items-start gap-3">
									<AlertTriangle size={20} class="text-warning-600 flex-none" />
									<div class="flex-1">
										<h3 class="font-semibold text-warning-700 dark:text-warning-400 mb-1">
											Warning
										</h3>
										<p class="text-sm text-warning-600 dark:text-warning-500">
											Triggering disasters will create real events that affect
											regions, settlements, resources, and population. This action cannot be
											undone.
										</p>
									</div>
								</div>
							</div>

							<!-- Recent Disasters (placeholder) -->
							<div class="card preset-filled-surface-200-700 p-4">
								<h3 class="font-semibold mb-3">Recent Triggered Disasters</h3>
								<p class="text-sm text-surface-600 dark:text-surface-400">
									No disasters triggered yet this session
								</p>
							</div>
						</div>
					</div>
				</div>
			{:else if activeTab === 'events'}
				<!-- Event Triggers Tab (Placeholder) -->
				<div class="space-y-4">
					<div>
						<h2 class="text-xl font-bold mb-2">Event Triggers</h2>
						<p class="text-surface-600 dark:text-surface-400 text-sm">
							Trigger custom game events, population movements, and special occurrences.
						</p>
					</div>
					<div
						class="card preset-filled-surface-200-700 p-8 text-center text-surface-600 dark:text-surface-400"
					>
						<Zap size={48} class="mx-auto mb-4 opacity-50" />
						<p class="font-semibold">Coming Soon</p>
						<p class="text-sm mt-2">Event trigger tools will be added here</p>
					</div>
				</div>
			{:else if activeTab === 'data'}
				<!-- Data Tools Tab (Placeholder) -->
				<div class="space-y-4">
					<div>
						<h2 class="text-xl font-bold mb-2">Data Management Tools</h2>
						<p class="text-surface-600 dark:text-surface-400 text-sm">
							Export data, run diagnostics, and manage game state.
						</p>
					</div>
					<div
						class="card preset-filled-surface-200-700 p-8 text-center text-surface-600 dark:text-surface-400"
					>
						<Database size={48} class="mx-auto mb-4 opacity-50" />
						<p class="font-semibold">Coming Soon</p>
						<p class="text-sm mt-2">Data management tools will be added here</p>
					</div>
				</div>
			{:else if activeTab === 'system'}
				<!-- System Tools Tab (Placeholder) -->
				<div class="space-y-4">
					<div>
						<h2 class="text-xl font-bold mb-2">System Tools</h2>
						<p class="text-surface-600 dark:text-surface-400 text-sm">
							Server management, cache control, and system diagnostics.
						</p>
					</div>
					<div
						class="card preset-filled-surface-200-700 p-8 text-center text-surface-600 dark:text-surface-400"
					>
						<Settings size={48} class="mx-auto mb-4 opacity-50" />
						<p class="font-semibold">Coming Soon</p>
						<p class="text-sm mt-2">System management tools will be added here</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
