<script lang="ts">
	import type { PageData } from './$types';
	import { Grid3x3, Search, ExternalLink, Home, Layers } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchTerm = $state('');
	
	let filteredPlots = $derived(data.plots.filter(plot => {
		if (!searchTerm) return true;
		const search = searchTerm.toLowerCase();
		return (
			plot.id.toLowerCase().includes(search) ||
			plot.tileId.toLowerCase().includes(search) ||
			(plot.Settlement?.id && plot.Settlement.id.toLowerCase().includes(search))
		);
	}));
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold flex items-center gap-2">
				<Grid3x3 size={28} />
				Plots
			</h1>
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
				View and manage settlement plots
			</p>
		</div>
	</div>

	<!-- Search Bar -->
	<div class="card preset-filled-surface-100-900 p-4">
		<div class="relative">
			<Search size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
			<input
				bind:value={searchTerm}
				type="search"
				placeholder="Search by plot ID, settlement, or tile..."
				class="input pl-10 w-full"
			/>
		</div>
		{#if searchTerm}
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-2">
				Found {filteredPlots.length} plot{filteredPlots.length === 1 ? '' : 's'}
			</p>
		{/if}
	</div>

	<!-- Plots List -->
	<div class="card preset-filled-surface-100-900">
		{#if filteredPlots.length === 0}
			<div class="p-12 text-center">
				<Grid3x3 size={48} class="mx-auto mb-4 text-surface-400" />
				<h3 class="text-xl font-semibold mb-2">
					{searchTerm ? 'No plots found' : 'No plots yet'}
				</h3>
				<p class="text-surface-600 dark:text-surface-400">
					{searchTerm ? 'Try a different search term' : 'Plots will appear here once settlements are created'}
				</p>
			</div>
		{:else}
			<div class="table-container">
				<table class="table" aria-describedby="plots-header">
					<thead>
						<tr>
							<th>Settlement</th>
							<th>Tile ID</th>
							<th>Area</th>
							<th>Plot ID</th>
							<th class="text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredPlots as plot}
							<tr class="hover:preset-tonal-surface-500">
								<td>
									{#if plot.Settlement?.id}
										<div class="flex items-center gap-2">
											<Home size={14} class="text-surface-400" />
											<span class="font-mono text-xs">{plot.Settlement.id}</span>
										</div>
									{:else}
										<span class="text-surface-400 italic text-sm">No settlement</span>
									{/if}
								</td>
								<td>
									<div class="flex items-center gap-2">
										<Layers size={14} class="text-surface-400" />
										<span class="font-mono text-xs">{plot.tileId}</span>
									</div>
								</td>
								<td>{plot.area}</td>
								<td class="font-mono text-xs">{plot.id}</td>
								<td class="text-right">
									<a
										href="/admin/plots/{plot.id}"
										class="btn btn-sm preset-tonal-primary-500 rounded-md"
									>
										<ExternalLink size={16} />
										<span>View</span>
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<td colspan="5" class="text-center text-sm text-surface-600 dark:text-surface-400">
								Total Plots: {filteredPlots.length}
								{#if searchTerm}
									(filtered from {data.plots.length})
								{/if}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>
</div>
