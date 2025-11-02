<script lang="ts">
	import type { PageData } from './$types';
	import { Layers, Search, ExternalLink, Thermometer, Droplets, Mountain } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchTerm = $state('');
	
	let filteredTiles = $derived(data.tiles.filter(tile => {
		if (!searchTerm) return true;
		const search = searchTerm.toLowerCase();
		return (
			tile.id.toLowerCase().includes(search) ||
			tile.type.toLowerCase().includes(search)
		);
	}));
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold flex items-center gap-2">
				<Layers size={28} />
				Tiles
			</h1>
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
				View and manage world tiles
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
				placeholder="Search by ID or type..."
				class="input pl-10 w-full"
			/>
		</div>
		{#if searchTerm}
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-2">
				Found {filteredTiles.length} tile{filteredTiles.length === 1 ? '' : 's'}
			</p>
		{/if}
	</div>

	<!-- Tiles List -->
	<div class="card preset-filled-surface-100-900">
		{#if filteredTiles.length === 0}
			<div class="p-12 text-center">
				<Layers size={48} class="mx-auto mb-4 text-surface-400" />
				<h3 class="text-xl font-semibold mb-2">
					{searchTerm ? 'No tiles found' : 'No tiles yet'}
				</h3>
				<p class="text-surface-600 dark:text-surface-400">
					{searchTerm ? 'Try a different search term' : 'Tiles will appear here once worlds are generated'}
				</p>
			</div>
		{:else}
			<div class="table-container">
				<table class="table" aria-describedby="tiles-header">
					<thead>
						<tr>
							<th>Type</th>
							<th>Elevation</th>
							<th>Precipitation</th>
							<th>Temperature</th>
							<th>ID</th>
							<th class="text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredTiles as tile}
							<tr class="hover:preset-tonal-surface-500">
								<td>
									<span class="badge preset-tonal-surface-500 capitalize">
										{tile.type}
									</span>
								</td>
								<td>
									<div class="flex items-center gap-2">
										<Mountain size={14} class="text-surface-400" />
										<span>{(tile.elevation * 100).toPrecision(3)}</span>
									</div>
								</td>
								<td>
									<div class="flex items-center gap-2">
										<Droplets size={14} class="text-surface-400" />
										<span>{tile.precipitation.toPrecision(3)}</span>
									</div>
								</td>
								<td>
									<div class="flex items-center gap-2">
										<Thermometer size={14} class="text-surface-400" />
										<span>{tile.temperature.toPrecision(3)}</span>
									</div>
								</td>
								<td class="font-mono text-xs">{tile.id}</td>
								<td class="text-right">
									<a
										href="/admin/tiles/{tile.id}"
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
							<td colspan="6" class="text-center text-sm text-surface-600 dark:text-surface-400">
								Total Tiles: {filteredTiles.length}
								{#if searchTerm}
									(filtered from {data.tiles.length})
								{/if}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>
</div>
