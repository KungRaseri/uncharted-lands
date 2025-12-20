<script lang="ts">
	import type { PageData } from './$types';
	import { Building2, Hammer, Info, ChevronRight } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let selectedCategory = $state<'extractors' | 'buildings'>('extractors');
	let selectedStructure = $state<any | null>(null);
	let showDetailModal = $state(false);

	function openDetailModal(structure: any) {
		selectedStructure = structure;
		showDetailModal = true;
	}

	function closeModal() {
		showDetailModal = false;
		selectedStructure = null;
	}

	function handleBackdropClick() {
		closeModal();
	}

	function handleBackdropKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeModal();
		}
	}

	function formatResources(resources: Record<string, number | undefined>): string {
		return Object.entries(resources)
			.filter(([_, value]) => value !== undefined)
			.map(([key, value]) => `${key}: ${value}`)
			.join(', ');
	}
</script>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>Dashboard</a
		>
		<span class="text-surface-400">/</span>
		<a
			href="/admin/settings"
			class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Settings</a
		>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">Structure Templates</span>
	</div>

	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold flex items-center gap-2">
				<Building2 size={28} />
				Structure Templates
			</h1>
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
				Configure available buildings and extractors
			</p>
		</div>
	</div>

	<!-- Info Banner -->
	<div class="card preset-filled-warning-500/10 p-4 border-2 border-warning-500">
		<div class="flex items-start gap-3">
			<Info size={20} class="text-warning-700 dark:text-warning-300 shrink-0 mt-0.5" />
			<div class="text-sm">
				<p class="font-medium text-warning-700 dark:text-warning-300 mb-1">
					System Structures (Read-Only)
				</p>
				<p class="text-warning-800 dark:text-warning-200">
					Current structures are defined in the database schema as enums. To add or modify
					structures, update the PostgreSQL enum definitions and run migrations. Dynamic
					structure management will be added in a future update.
				</p>
			</div>
		</div>
	</div>

	<!-- Category Tabs -->
	<div class="card preset-filled-surface-100-900 p-2">
		<div class="flex gap-2">
			<button
				type="button"
				class="btn rounded-md flex-1 {selectedCategory === 'extractors'
					? 'preset-filled-primary-500'
					: 'preset-tonal-surface-500'}"
				onclick={() => (selectedCategory = 'extractors')}
			>
				<Hammer size={20} />
				<span>Extractors ({data.structures.extractors.length})</span>
			</button>
			<button
				type="button"
				class="btn rounded-md flex-1 {selectedCategory === 'buildings'
					? 'preset-filled-primary-500'
					: 'preset-tonal-surface-500'}"
				onclick={() => (selectedCategory = 'buildings')}
			>
				<Building2 size={20} />
				<span>Buildings ({data.structures.buildings.length})</span>
			</button>
		</div>
	</div>

	<!-- Structures Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each selectedCategory === 'extractors' ? data.structures.extractors : data.structures.buildings as structure}
			<button
				type="button"
				class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-surface-500 transition-all group text-left w-full"
				onclick={() => openDetailModal(structure)}
			>
				<div class="flex items-start justify-between mb-4">
					<div class="flex items-center gap-3">
						<div
							class="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center"
						>
							{#if selectedCategory === 'extractors'}
								<Hammer size={24} class="text-primary-500" />
							{:else}
								<Building2 size={24} class="text-primary-500" />
							{/if}
						</div>
						<div>
							<h3 class="text-lg font-bold">{structure.name}</h3>
							<span class="badge preset-tonal-primary-500 text-xs">
								{structure.id}
							</span>
						</div>
					</div>
					<ChevronRight
						size={20}
						class="text-surface-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all"
					/>
				</div>

				<p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
					{structure.description}
				</p>

				<div class="space-y-2 text-sm">
					{#if 'baseProduction' in structure && structure.baseProduction}
						<div>
							<span class="text-surface-600 dark:text-surface-400">Production:</span>
							<span class="font-mono text-xs ml-2">
								{formatResources(structure.baseProduction as Record<string, any>)}</span
							>
						</div>
					{/if}
					{#if 'capacity' in structure && structure.capacity}
						<div>
							<span class="text-surface-600 dark:text-surface-400">Capacity:</span>
							<span class="font-semibold ml-2">{structure.capacity} </span>
						</div>
					{/if}
					{#if 'storageBonus' in structure && structure.storageBonus}
						<div>
							<span class="text-surface-600 dark:text-surface-400">
								Storage Bonus:
							</span>
							<span class="font-semibold ml-2">+{structure.storageBonus} </span>
						</div>
					{/if}
					{#if 'defenseBonus' in structure && structure.defenseBonus}
						<div>
							<span class="text-surface-600 dark:text-surface-400">Defense:</span>
							<span class="font-semibold ml-2">+{structure.defenseBonus} </span>
						</div>
					{/if}
					<div>
						<span class="text-surface-600 dark:text-surface-400">Cost:</span>
						<span class="font-mono text-xs ml-2">
							{formatResources((structure.baseCost || structure.costs) as Record<string, any>)}
						</span>
					</div>
				</div>

				<div class="mt-4 pt-4 border-t border-surface-300 dark:border-surface-700">
					<span
						class="badge {(structure.enabled ?? true)
							? 'preset-filled-success-500'
							: 'preset-filled-error-500'} text-xs"
					>
						{(structure.enabled ?? true) ? 'Enabled' : 'Disabled'}
					</span>
				</div>
			</button>
		{/each}
	</div>
</div>

<!-- Structure Detail Modal -->
{#if showDetailModal && selectedStructure}
	<div
		class="modal-backdrop"
		onclick={handleBackdropClick}
		onkeydown={handleBackdropKeydown}
		role="presentation"
		tabindex="-1"
	></div>
	<div class="modal card preset-filled-surface-100-900 p-6 w-full max-w-2xl shadow-xl">
		<header class="mb-6">
			<div class="flex items-center gap-3 mb-2">
				<div
					class="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center"
				>
					{#if selectedStructure.category === 'EXTRACTOR'}
						<Hammer size={24} class="text-primary-500" />
					{:else}
						<Building2 size={24} class="text-primary-500" />
					{/if}
				</div>
				<div>
					<h3 class="text-2xl font-bold">{selectedStructure.name}</h3>
					<span class="badge preset-tonal-primary-500 text-xs">
						{selectedStructure.id}
					</span>
				</div>
			</div>
			<p class="text-sm text-surface-600 dark:text-surface-400">
				{selectedStructure.description}
			</p>
		</header>

		<div class="space-y-6">
			<!-- Base Stats -->
			<div>
				<h4 class="font-bold text-sm text-surface-600 dark:text-surface-400 uppercase mb-3">
					Base Statistics
				</h4>
				<div class="grid grid-cols-2 gap-4">
					<div class="card preset-tonal-surface-500 p-4">
						<div class="text-sm text-surface-600 dark:text-surface-400 mb-1">
							Category
						</div>
						<div class="font-semibold">{selectedStructure.category}</div>
					</div>
					{#if 'baseProduction' in selectedStructure && selectedStructure.baseProduction}
						<div class="card preset-tonal-success-500 p-4">
							<div class="text-sm text-surface-600 dark:text-surface-400 mb-1">
								Production
							</div>
							<div class="font-mono text-sm">
								{formatResources(selectedStructure.baseProduction)}
							</div>
						</div>
					{/if}
					{#if 'capacity' in selectedStructure && selectedStructure.capacity}
						<div class="card preset-tonal-primary-500 p-4">
							<div class="text-sm text-surface-600 dark:text-surface-400 mb-1">
								Capacity
							</div>
							<div class="font-semibold">{selectedStructure.capacity} units</div>
						</div>
					{/if}
					{#if 'storageBonus' in selectedStructure && selectedStructure.storageBonus}
						<div class="card preset-tonal-primary-500 p-4">
							<div class="text-sm text-surface-600 dark:text-surface-400 mb-1">
								Storage Bonus
							</div>
							<div class="font-semibold">+{selectedStructure.storageBonus}</div>
						</div>
					{/if}
					{#if 'defenseBonus' in selectedStructure && selectedStructure.defenseBonus}
						<div class="card preset-tonal-warning-500 p-4">
							<div class="text-sm text-surface-600 dark:text-surface-400 mb-1">
								Defense Bonus
							</div>
							<div class="font-semibold">+{selectedStructure.defenseBonus}</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Construction Cost -->
			<div>
				<h4 class="font-bold text-sm text-surface-600 dark:text-surface-400 uppercase mb-3">
					Construction Cost
				</h4>
				<div class="card preset-tonal-surface-500 p-4">
					<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
						{#each Object.entries(selectedStructure.baseCost) as [resource, amount]}
							<div>
								<div class="text-xs text-surface-600 dark:text-surface-400">
									{resource}
								</div>
								<div class="font-bold text-lg">{amount}</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Requirements -->
			<div>
				<h4 class="font-bold text-sm text-surface-600 dark:text-surface-400 uppercase mb-3">
					Plot Requirements
				</h4>
				<div class="card preset-tonal-surface-500 p-4">
					<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
						{#each Object.entries(selectedStructure.requirements) as [req, value]}
							<div>
								<div
									class="text-xs text-surface-600 dark:text-surface-400 capitalize"
								>
									{req}
								</div>
								<div class="font-bold text-lg">{value}</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Status -->
			<div>
				<h4 class="font-bold text-sm text-surface-600 dark:text-surface-400 uppercase mb-3">
					Availability
				</h4>
				<div class="flex items-center gap-3">
					<span
						class="badge {selectedStructure.enabled
							? 'preset-filled-success-500'
							: 'preset-filled-error-500'} text-sm px-4 py-2"
					>
						{selectedStructure.enabled ? 'Enabled' : 'Disabled'}
					</span>
					<span class="text-sm text-surface-600 dark:text-surface-400">
						{selectedStructure.enabled
							? 'Players can build this structure'
							: 'This structure is not available for construction'}
					</span>
				</div>
			</div>
		</div>

		<footer
			class="flex justify-end gap-2 mt-6 pt-4 border-t border-surface-300 dark:border-surface-700"
		>
			<button
				type="button"
				class="btn preset-tonal-surface-500 rounded-md"
				onclick={closeModal}
			>
				Close
			</button>
		</footer>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		z-index: 998;
		backdrop-filter: blur(4px);
	}

	.modal {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 999;
		max-height: 90vh;
		overflow-y: auto;
	}
</style>
