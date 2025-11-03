<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { Building2, Home, MapPin, Package, Sun, Wind, ArrowLeft, Droplet, Trees, Mountain, Pickaxe, Plus, X, ShieldAlert, Warehouse, Hammer } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { STRUCTURE_DEFINITIONS, getStructureCategories, getStructuresByCategory, canBuildStructure, type StructureDefinition } from '$lib/game/structures';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Build modal state
	let buildModalOpen = $state(false);
	let selectedCategory = $state<StructureDefinition['category']>('housing');
	let selectedStructure = $state<StructureDefinition | null>(null);
	let isBuilding = $state(false);

	const categories = getStructureCategories();

	function openBuildModal() {
		buildModalOpen = true;
	}

	function closeBuildModal() {
		if (!isBuilding) {
			buildModalOpen = false;
			selectedStructure = null;
		}
	}

	function selectStructure(structure: StructureDefinition) {
		selectedStructure = structure;
	}

	// Get category icon
	function getCategoryIcon(category: StructureDefinition['category']) {
		switch (category) {
			case 'housing': return Home;
			case 'production': return Hammer;
			case 'storage': return Warehouse;
			case 'defense': return ShieldAlert;
			case 'utility': return Package;
		}
	}

	// Check affordability
	let affordability = $derived(
		selectedStructure
			? canBuildStructure(selectedStructure, data.settlement.Storage, data.settlement.Plot)
			: { canBuild: false, reasons: [] }
	);
</script>

<div class="max-w-7xl mx-auto p-6 space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/game" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Game</a>
		<span class="text-surface-400">/</span>
		<a href="/game/settlements" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Settlements</a>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">{data.settlement.name}</span>
	</div>

	<!-- Settlement Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-start justify-between mb-4">
			<div class="flex items-center gap-4">
				<div class="p-3 bg-primary-500/10 rounded-lg">
					<Building2 size={32} class="text-primary-500" />
				</div>
				<div>
					<h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100">{data.settlement.name}</h1>
					<p class="text-sm text-surface-600 dark:text-surface-400 font-mono">{data.settlement.id}</p>
				</div>
			</div>
			<span class="badge preset-filled-success-500">Active</span>
		</div>

		<!-- Quick Stats -->
		<div class="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
			<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
				<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Structures</p>
				<p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
					{data.settlement.Structures.length}
				</p>
			</div>
			<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
				<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Plot Area</p>
				<p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
					{data.settlement.Plot.area}
				</p>
			</div>
			<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
				<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Solar</p>
				<p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
					{data.settlement.Plot.solar}
				</p>
			</div>
			<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
				<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Wind</p>
				<p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
					{data.settlement.Plot.wind}
				</p>
			</div>
			<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
				<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Created</p>
				<p class="text-sm font-semibold text-surface-900 dark:text-surface-100">
					{new Date(data.settlement.createdAt).toLocaleDateString()}
				</p>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Resources Storage -->
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-surface-900 dark:text-surface-100">
				<Package size={24} />
				Storage
			</h2>
			<div class="space-y-3">
				<div class="flex items-center justify-between p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<div class="flex items-center gap-2">
						<Droplet size={20} class="text-success-500" />
						<span class="font-medium text-surface-900 dark:text-surface-100">Food</span>
					</div>
					<span class="text-xl font-bold text-surface-900 dark:text-surface-100">
						{data.settlement.Storage.food}
					</span>
				</div>
				<div class="flex items-center justify-between p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<div class="flex items-center gap-2">
						<Droplet size={20} class="text-primary-500" />
						<span class="font-medium text-surface-900 dark:text-surface-100">Water</span>
					</div>
					<span class="text-xl font-bold text-surface-900 dark:text-surface-100">
						{data.settlement.Storage.water}
					</span>
				</div>
				<div class="flex items-center justify-between p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<div class="flex items-center gap-2">
						<Trees size={20} class="text-secondary-500" />
						<span class="font-medium text-surface-900 dark:text-surface-100">Wood</span>
					</div>
					<span class="text-xl font-bold text-surface-900 dark:text-surface-100">
						{data.settlement.Storage.wood}
					</span>
				</div>
				<div class="flex items-center justify-between p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<div class="flex items-center gap-2">
						<Mountain size={20} class="text-tertiary-500" />
						<span class="font-medium text-surface-900 dark:text-surface-100">Stone</span>
					</div>
					<span class="text-xl font-bold text-surface-900 dark:text-surface-100">
						{data.settlement.Storage.stone}
					</span>
				</div>
				<div class="flex items-center justify-between p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<div class="flex items-center gap-2">
						<Pickaxe size={20} class="text-warning-500" />
						<span class="font-medium text-surface-900 dark:text-surface-100">Ore</span>
					</div>
					<span class="text-xl font-bold text-surface-900 dark:text-surface-100">
						{data.settlement.Storage.ore}
					</span>
				</div>
			</div>
		</div>

		<!-- Plot Resources -->
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-xl font-bold mb-4 flex items-center gap-2 text-surface-900 dark:text-surface-100">
				<MapPin size={24} />
				Plot Resources
			</h2>
			<p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
				Available resources from this plot's natural properties
			</p>
			<div class="space-y-3">
				<div class="flex items-center justify-between p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<div class="flex items-center gap-2">
						<Droplet size={18} class="text-success-500" />
						<span class="text-sm font-medium text-surface-900 dark:text-surface-100">Food Capacity</span>
					</div>
					<span class="font-bold text-surface-900 dark:text-surface-100">{data.settlement.Plot.food}/10</span>
				</div>
				<div class="flex items-center justify-between p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<div class="flex items-center gap-2">
						<Droplet size={18} class="text-primary-500" />
						<span class="text-sm font-medium text-surface-900 dark:text-surface-100">Water Capacity</span>
					</div>
					<span class="font-bold text-surface-900 dark:text-surface-100">{data.settlement.Plot.water}/10</span>
				</div>
				<div class="flex items-center justify-between p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<div class="flex items-center gap-2">
						<Trees size={18} class="text-secondary-500" />
						<span class="text-sm font-medium text-surface-900 dark:text-surface-100">Wood Capacity</span>
					</div>
					<span class="font-bold text-surface-900 dark:text-surface-100">{data.settlement.Plot.wood}/10</span>
				</div>
				<div class="flex items-center justify-between p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<div class="flex items-center gap-2">
						<Mountain size={18} class="text-tertiary-500" />
						<span class="text-sm font-medium text-surface-900 dark:text-surface-100">Stone Capacity</span>
					</div>
					<span class="font-bold text-surface-900 dark:text-surface-100">{data.settlement.Plot.stone}/10</span>
				</div>
				<div class="flex items-center justify-between p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<div class="flex items-center gap-2">
						<Pickaxe size={18} class="text-warning-500" />
						<span class="text-sm font-medium text-surface-900 dark:text-surface-100">Ore Capacity</span>
					</div>
					<span class="font-bold text-surface-900 dark:text-surface-100">{data.settlement.Plot.ore}/10</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Success/Error Messages -->
	{#if form?.success}
		<aside class="alert preset-filled-success-500 rounded-md">
			<div class="alert-message">
				<p>{form.message}</p>
			</div>
		</aside>
	{:else if form?.success === false}
		<aside class="alert preset-filled-error-500 rounded-md">
			<div class="alert-message">
				<p>{form.message}</p>
				{#if form.reasons}
					<ul class="text-sm mt-2 list-disc list-inside">
						{#each form.reasons as reason}
							<li>{reason}</li>
						{/each}
					</ul>
				{/if}
			</div>
		</aside>
	{/if}

	<!-- Structures -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-bold flex items-center gap-2 text-surface-900 dark:text-surface-100">
				<Home size={24} />
				Structures ({data.settlement.Structures.length})
			</h2>
			<button 
				onclick={openBuildModal}
				class="btn btn-sm preset-filled-primary-500 rounded-md"
			>
				<Plus size={16} />
				<span>Build Structure</span>
			</button>
		</div>

		{#if data.settlement.Structures.length === 0}
			<div class="text-center py-8">
				<Home size={48} class="mx-auto mb-4 text-surface-400" />
				<p class="text-surface-600 dark:text-surface-400 mb-4">No structures built yet</p>
				<button 
					onclick={openBuildModal}
					class="btn preset-filled-primary-500 rounded-md"
				>
					<Plus size={20} />
					<span>Build Your First Structure</span>
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each data.settlement.Structures as structure}
					<div class="card preset-filled-surface-200-700 p-4">
						<h3 class="font-bold text-lg mb-2 text-surface-900 dark:text-surface-100">{structure.name}</h3>
						<p class="text-sm text-surface-600 dark:text-surface-400 mb-3">{structure.description}</p>

						{#if structure.modifiers.length > 0}
							<div class="space-y-2">
								<p class="text-xs font-semibold text-surface-700 dark:text-surface-300">Modifiers:</p>
								{#each structure.modifiers as modifier}
									<div class="flex items-center justify-between text-sm bg-surface-300 dark:bg-surface-600 rounded px-3 py-1">
										<span class="text-surface-900 dark:text-surface-100">{modifier.name}</span>
										<span class="font-bold text-primary-500">+{modifier.value}</span>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Back Button -->
	<div>
		<a href="/game/settlements" class="btn preset-tonal-surface-500 rounded-md">
			<ArrowLeft size={20} />
			<span>Back to Settlements</span>
		</a>
	</div>
</div>

<!-- Build Structure Modal -->
{#if buildModalOpen}
	<div class="modal-backdrop" onclick={closeBuildModal}>
		<div class="modal preset-filled-surface-50-950 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" onclick={(e) => e.stopPropagation()}>
			<header class="modal-header border-b border-surface-300 dark:border-surface-700 flex-none">
				<div class="flex items-center justify-between">
					<h3 class="h3">Build Structure</h3>
					<button onclick={closeBuildModal} class="btn btn-sm preset-tonal-surface-500 rounded-md" disabled={isBuilding}>
						<X size={16} />
					</button>
				</div>
			</header>
			
			<div class="flex flex-1 overflow-hidden">
				<!-- Category Sidebar -->
				<aside class="w-48 border-r border-surface-300 dark:border-surface-700 p-4 overflow-y-auto flex-none">
					<nav class="space-y-2">
						{#each categories as category}
							{@const Icon = getCategoryIcon(category)}
							<button
								onclick={() => {
									selectedCategory = category;
									selectedStructure = null;
								}}
								class="w-full text-left px-3 py-2 rounded-md transition-colors capitalize {selectedCategory === category
									? 'bg-primary-500 text-white'
									: 'hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-900 dark:text-surface-100'}"
							>
								<div class="flex items-center gap-2">
									<Icon size={18} />
									<span>{category}</span>
								</div>
							</button>
						{/each}
					</nav>
				</aside>

				<!-- Structure List -->
				<section class="flex-1 p-6 overflow-y-auto">
					<h4 class="text-lg font-bold mb-4 capitalize text-surface-900 dark:text-surface-100">
						{selectedCategory} Structures
					</h4>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each getStructuresByCategory(selectedCategory) as structure}
							{@const availability = canBuildStructure(structure, data.settlement.Storage, data.settlement.Plot)}
							<button
								onclick={() => selectStructure(structure)}
								class="text-left card preset-filled-surface-200-700 p-4 hover:preset-tonal-primary-500 transition-colors {selectedStructure?.id === structure.id ? 'ring-2 ring-primary-500' : ''}"
							>
								<h5 class="font-bold mb-2 text-surface-900 dark:text-surface-100">{structure.name}</h5>
								<p class="text-sm text-surface-600 dark:text-surface-400 mb-3">{structure.description}</p>
								
								<!-- Requirements -->
								<div class="space-y-1 text-xs">
									<p class="font-semibold text-surface-700 dark:text-surface-300">Costs:</p>
									<div class="flex flex-wrap gap-2">
										{#if structure.requirements.area > 0}
											<span class="badge preset-tonal-surface-500">Area: {structure.requirements.area}</span>
										{/if}
										{#if structure.requirements.solar > 0}
											<span class="badge preset-tonal-surface-500">Solar: {structure.requirements.solar}</span>
										{/if}
										{#if structure.requirements.wind > 0}
											<span class="badge preset-tonal-surface-500">Wind: {structure.requirements.wind}</span>
										{/if}
										{#if structure.requirements.food > 0}
											<span class="badge preset-tonal-surface-500">Food: {structure.requirements.food}</span>
										{/if}
										{#if structure.requirements.water > 0}
											<span class="badge preset-tonal-surface-500">Water: {structure.requirements.water}</span>
										{/if}
										{#if structure.requirements.wood > 0}
											<span class="badge preset-tonal-surface-500">Wood: {structure.requirements.wood}</span>
										{/if}
										{#if structure.requirements.stone > 0}
											<span class="badge preset-tonal-surface-500">Stone: {structure.requirements.stone}</span>
										{/if}
										{#if structure.requirements.ore > 0}
											<span class="badge preset-tonal-surface-500">Ore: {structure.requirements.ore}</span>
										{/if}
									</div>
								</div>

								{#if !availability.canBuild}
									<div class="mt-2">
										<span class="badge preset-filled-error-500 text-xs">Cannot build</span>
									</div>
								{/if}
							</button>
						{/each}
					</div>
				</section>

				<!-- Structure Details & Build -->
				{#if selectedStructure}
					<aside class="w-80 border-l border-surface-300 dark:border-surface-700 p-6 overflow-y-auto flex-none">
						<h4 class="text-lg font-bold mb-2 text-surface-900 dark:text-surface-100">{selectedStructure.name}</h4>
						<p class="text-sm text-surface-600 dark:text-surface-400 mb-4">{selectedStructure.description}</p>

						<!-- Modifiers -->
						{#if selectedStructure.modifiers.length > 0}
							<div class="mb-4">
								<p class="text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">Benefits:</p>
								<div class="space-y-2">
									{#each selectedStructure.modifiers as modifier}
										<div class="bg-surface-300 dark:bg-surface-600 rounded px-3 py-2">
											<div class="flex items-center justify-between mb-1">
												<span class="text-sm font-medium text-surface-900 dark:text-surface-100">{modifier.name}</span>
												<span class="font-bold text-primary-500">+{modifier.value}</span>
											</div>
											<p class="text-xs text-surface-600 dark:text-surface-400">{modifier.description}</p>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Requirements Check -->
						<div class="mb-4">
							<p class="text-sm font-semibold mb-2 text-surface-700 dark:text-surface-300">Requirements:</p>
							{#if affordability.canBuild}
								<div class="p-3 bg-success-500/10 border border-success-500 rounded-lg">
									<p class="text-sm text-success-500 font-semibold">✓ All requirements met</p>
								</div>
							{:else}
								<div class="p-3 bg-error-500/10 border border-error-500 rounded-lg">
									<p class="text-sm text-error-500 font-semibold mb-2">✗ Missing requirements:</p>
									<ul class="text-xs text-error-500 space-y-1">
										{#each affordability.reasons as reason}
											<li>• {reason}</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>

						<!-- Build Button -->
						<form 
							method="POST" 
							action="?/buildStructure"
							use:enhance={() => {
								isBuilding = true;
								return async ({ update }) => {
									await update();
									isBuilding = false;
									if (form?.success) {
										closeBuildModal();
									}
								};
							}}
						>
							<input type="hidden" name="structureId" value={selectedStructure.id} />
							<button
								type="submit"
								class="btn preset-filled-primary-500 rounded-md w-full"
								disabled={!affordability.canBuild || isBuilding}
							>
								{#if isBuilding}
									<span>Building...</span>
								{:else}
									<Hammer size={20} />
									<span>Build {selectedStructure.name}</span>
								{/if}
							</button>
						</form>
					</aside>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 999;
	}

	.modal {
		border-radius: 0.5rem;
	}

	.modal-header {
		padding: 1.5rem;
	}
</style>
