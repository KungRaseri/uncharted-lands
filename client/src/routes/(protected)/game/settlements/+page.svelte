<script lang="ts">
	import type { PageData } from './$types';
	import type { SettlementWithStorage } from '@uncharted-lands/shared';
	import { Building2, Search, MapPin, Package, Plus, Home, RefreshCw } from 'lucide-svelte';
	import { createGameRefreshInterval, refreshGameData } from '$lib/stores/game/gameState.svelte';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	// State for UI feedback
	let isRefreshing = $state(false);

	async function handleManualRefresh() {
		isRefreshing = true;
		refreshGameData('game:settlements');
		setTimeout(() => {
			isRefreshing = false;
		}, 500);
	}

	onMount(() => {
		// Auto-refresh every minute to catch tick updates
		const cleanup = createGameRefreshInterval('game:settlements');
		return cleanup;
	});

	let searchTerm = $state('');
	let viewMode = $state<'grid' | 'list'>('grid');

	let filteredSettlements = $derived(
		data.settlements.filter((settlement: SettlementWithStorage) => {
			if (!searchTerm) return true;
			const search = searchTerm.toLowerCase();
			return (
				settlement.id.toLowerCase().includes(search) ||
				settlement.name.toLowerCase().includes(search)
			);
		})
	);
</script>

<div class="max-w-7xl mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<h1
				class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-2"
			>
				<Building2 size={32} />
				Settlements
			</h1>
			<p class="text-surface-600 dark:text-surface-400">Manage and monitor all your settlements</p>
		</div>
		<button
			onclick={handleManualRefresh}
			disabled={isRefreshing}
			class="btn preset-tonal-surface-500 rounded-md"
			title="Refresh data (auto-refreshes every minute)"
		>
			<RefreshCw size={16} class={isRefreshing ? 'animate-spin' : ''} />
			<span class="hidden sm:inline">Refresh</span>
		</button>
	</div>

	<!-- Search & Filters -->
	<div class="card preset-filled-surface-100-900 p-4">
		<div class="flex items-center gap-4">
			<div class="relative flex-1">
				<Search size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
				<input
					bind:value={searchTerm}
					type="search"
					placeholder="Search by name or ID..."
					class="input pl-10 w-full"
				/>
			</div>
			<div class="flex items-center gap-2">
				<button
					onclick={() => (viewMode = 'grid')}
					class="btn btn-sm {viewMode === 'grid'
						? 'preset-filled-primary-500'
						: 'preset-tonal-surface-500'} rounded-md"
				>
					Grid
				</button>
				<button
					onclick={() => (viewMode = 'list')}
					class="btn btn-sm {viewMode === 'list'
						? 'preset-filled-primary-500'
						: 'preset-tonal-surface-500'} rounded-md"
				>
					List
				</button>
			</div>
		</div>
		{#if searchTerm}
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-2">
				Found {filteredSettlements.length} settlement{filteredSettlements.length === 1 ? '' : 's'}
			</p>
		{/if}
	</div>

	<!-- Settlements -->
	{#if filteredSettlements.length === 0}
		<div class="card preset-filled-surface-100-900 p-12 text-center">
			<Building2 size={48} class="mx-auto mb-4 text-surface-400" />
			<h3 class="text-xl font-semibold mb-2 text-surface-900 dark:text-surface-100">
				{searchTerm ? 'No settlements found' : 'No settlements yet'}
			</h3>
			<p class="text-surface-600 dark:text-surface-400">
				{searchTerm
					? 'Try a different search term'
					: 'Settlements will appear here once you establish them in the world'}
			</p>
		</div>
	{:else if viewMode === 'grid'}
		<!-- Grid View -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each filteredSettlements as settlement}
				<a
					href="/game/settlements/{settlement.id}"
					class="card preset-filled-surface-100-900 p-5 hover:preset-tonal-primary-500 transition-colors group"
				>
					<div class="flex items-start justify-between mb-4">
						<div class="flex items-center gap-2">
							<Building2 size={24} class="text-primary-500 group-hover:text-white" />
							<div>
								<h3
									class="font-bold text-lg text-surface-900 dark:text-surface-100 group-hover:text-white"
								>
									{settlement.name}
								</h3>
								<p
									class="text-xs text-surface-500 dark:text-surface-500 font-mono group-hover:text-white/60"
								>
									{settlement.id.slice(0, 12)}...
								</p>
							</div>
						</div>
						<span class="badge preset-filled-success-500 text-xs">Active</span>
					</div>

					<div class="space-y-3">
						<!-- Location -->
						<div
							class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 group-hover:text-white/80"
						>
							<MapPin size={14} />
							<span>Tile: {settlement.tileId.slice(0, 8)}...</span>
						</div>

						<!-- Structures -->
						<div
							class="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400 group-hover:text-white/80"
						>
							<Home size={14} />
							<span
								>{settlement.structures?.length || 0} Structure{settlement.structures?.length === 1
									? ''
									: 's'}</span
							>
						</div>

						<!-- Resources -->
						<div
							class="pt-3 border-t border-surface-300 dark:border-surface-700 group-hover:border-white/20"
						>
							<div
								class="flex items-center gap-2 mb-2 text-sm text-surface-600 dark:text-surface-400 group-hover:text-white/80"
							>
								<Package size={14} />
								<span>Resources</span>
							</div>
							<div class="grid grid-cols-3 gap-2 text-xs">
								<div
									class="bg-surface-200 dark:bg-surface-700 group-hover:bg-white/10 rounded px-2 py-1"
								>
									<p class="text-surface-500 dark:text-surface-500 group-hover:text-white/60">
										Food
									</p>
									<p
										class="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-white"
									>
										{settlement.storage?.food || 0}
									</p>
								</div>
								<div
									class="bg-surface-200 dark:bg-surface-700 group-hover:bg-white/10 rounded px-2 py-1"
								>
									<p class="text-surface-500 dark:text-surface-500 group-hover:text-white/60">
										Water
									</p>
									<p
										class="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-white"
									>
										{settlement.storage?.water || 0}
									</p>
								</div>
								<div
									class="bg-surface-200 dark:bg-surface-700 group-hover:bg-white/10 rounded px-2 py-1"
								>
									<p class="text-surface-500 dark:text-surface-500 group-hover:text-white/60">
										Wood
									</p>
									<p
										class="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-white"
									>
										{settlement.storage?.wood || 0}
									</p>
								</div>
								<div
									class="bg-surface-200 dark:bg-surface-700 group-hover:bg-white/10 rounded px-2 py-1"
								>
									<p class="text-surface-500 dark:text-surface-500 group-hover:text-white/60">
										Stone
									</p>
									<p
										class="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-white"
									>
										{settlement.storage?.stone || 0}
									</p>
								</div>
								<div
									class="bg-surface-200 dark:bg-surface-700 group-hover:bg-white/10 rounded px-2 py-1"
								>
									<p class="text-surface-500 dark:text-surface-500 group-hover:text-white/60">
										Ore
									</p>
									<p
										class="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-white"
									>
										{settlement.storage?.ore || 0}
									</p>
								</div>
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<!-- List View -->
		<div class="card preset-filled-surface-100-900">
			<div class="table-container">
				<table class="table" aria-describedby="settlements-header">
					<thead>
						<tr>
							<th>Name</th>
							<th>Location</th>
							<th>Structures</th>
							<th class="text-center">Food</th>
							<th class="text-center">Water</th>
							<th class="text-center">Wood</th>
							<th class="text-center">Stone</th>
							<th class="text-center">Ore</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredSettlements as settlement}
							<tr class="hover:preset-tonal-surface-500">
								<td>
									<a
										href="/game/settlements/{settlement.id}"
										class="font-semibold hover:text-primary-500"
									>
										{settlement.name}
									</a>
									<p class="text-xs text-surface-500 font-mono">{settlement.id.slice(0, 12)}...</p>
								</td>
								<td class="text-sm">
									<div class="flex items-center gap-2">
										<MapPin size={14} class="text-surface-400" />
										<span>{settlement.tileId.slice(0, 8)}...</span>
									</div>
								</td>
								<td>{settlement.structures?.length || 0}</td>
								<td class="text-center font-semibold">{settlement.storage?.food || 0}</td>
								<td class="text-center font-semibold">{settlement.storage?.water || 0}</td>
								<td class="text-center font-semibold">{settlement.storage?.wood || 0}</td>
								<td class="text-center font-semibold">{settlement.storage?.stone || 0}</td>
								<td class="text-center font-semibold">{settlement.storage?.ore || 0}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<td colspan="8" class="text-center text-sm text-surface-600 dark:text-surface-400">
								Total Settlements: {filteredSettlements.length}
								{#if searchTerm}
									(filtered from {data.settlements.length})
								{/if}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	{/if}
</div>
