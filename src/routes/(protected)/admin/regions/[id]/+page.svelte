<script lang="ts">
	import type { PageData } from './$types';
	import { MapPin, Globe, Layers, ArrowLeft, Mountain, Droplets, Thermometer, Home } from 'lucide-svelte';
	import WorldMap from '$lib/components/shared/WorldMap.svelte';
	import type { Plot, TileWithRelations } from '$lib/types/game';

	let { data }: { data: PageData } = $props();
	
	// Convert the region data to the format WorldMap expects
	const regionForMap = $derived({
		...data.region,
		tiles: data.region.tiles
	});
</script>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Dashboard</a>
		<span class="text-surface-400">/</span>
		<a href="/admin/worlds" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Worlds</a>
		<span class="text-surface-400">/</span>
		<a href="/admin/worlds/{data.region.worldId}" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">{data.region.world.name}</a>
		<span class="text-surface-400">/</span>
		<span class="text-surface-600 dark:text-surface-400">Regions</span>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">{data.region.name || 'Region'}</span>
	</div>

	<!-- Region Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-start gap-6">
			<div class="flex-none w-16 h-16 rounded-full bg-warning-500/10 flex items-center justify-center">
				<MapPin size={32} class="text-warning-500" />
			</div>

			<div class="flex-1">
				<h1 class="text-3xl font-bold mb-2">{data.region.name || 'Unnamed Region'}</h1>
				<p class="text-sm text-surface-600 dark:text-surface-400 font-mono mb-4">{data.region.id}</p>
				
				<div class="flex items-center gap-2">
					<Globe size={16} class="text-surface-400" />
					<a href="/admin/worlds/{data.region.worldId}" class="text-primary-500 hover:underline">
						{data.region.world.name}
					</a>
				</div>
			</div>
		</div>
	</div>

	<!-- Region Map Preview -->
	{#if data.region.tiles.length > 0}
		<WorldMap 
			regions={[regionForMap]} 
			viewLevel="region"
			title="{data.region.name || 'Region'} Preview (Elevation)"
			mode="admin"
			showStats={true}
			showLegend={true}
			legendView="terrain"
		/>
	{/if}

	<!-- Tiles Table -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-bold flex items-center gap-2">
				<Layers size={24} />
				Tiles ({data.region.tiles.length})
			</h2>
			<div class="text-sm text-surface-600 dark:text-surface-400">
				Click a tile to view details
			</div>
		</div>

		{#if data.region.tiles.length === 0}
			<div class="p-8 text-center">
				<Layers size={48} class="mx-auto mb-4 text-surface-400" />
				<p class="text-surface-600 dark:text-surface-400">No tiles in this region</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table-auto w-full">
					<thead>
						<tr class="border-b border-surface-300 dark:border-surface-600">
							<th class="text-left p-3 font-semibold text-sm">Tile ID</th>
							<th class="text-center p-3 font-semibold text-sm">Type</th>
							<th class="text-center p-3 font-semibold text-sm">Biome</th>
							<th class="text-center p-3 font-semibold text-sm">Elevation</th>
							<th class="text-center p-3 font-semibold text-sm">Precipitation</th>
							<th class="text-center p-3 font-semibold text-sm">Temperature</th>
							<th class="text-center p-3 font-semibold text-sm">Plots</th>
							<th class="text-center p-3 font-semibold text-sm">Settlements</th>
							<th class="text-right p-3 font-semibold text-sm">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.region.tiles as tile}
							{@const hasSettlement = tile.plots?.some((p: Plot) => p.Settlement)}
							{@const tileColor = tile.type === 'OCEAN' ? 'text-primary-500' : 'text-success-500'}
							<tr class="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
								<td class="p-3">
									<div class="flex items-center gap-2">
										<div
											class="w-8 h-8 rounded"
											style="background-color: {tile.elevation < -0.3 ? '#001a33' : tile.elevation < 0 ? '#003d66' : tile.elevation < 0.3 ? '#7cb342' : tile.elevation < 0.7 ? '#8d6e63' : '#757575'}"
											title="Elevation: {tile.elevation.toFixed(3)}"
										></div>
										<p class="font-mono text-xs">{tile.id.substring(0, 8)}...</p>
									</div>
								</td>
								<td class="p-3 text-center">
									<span class="px-2 py-1 rounded text-xs font-semibold {tileColor} bg-current/10 capitalize">
										{tile.type.toLowerCase()}
									</span>
								</td>
								<td class="p-3 text-center">
									<span class="text-sm">{tile.Biome?.name || 'Unknown'}</span>
								</td>
								<td class="p-3 text-center">
									<div class="flex items-center justify-center gap-1">
										<Mountain size={14} class="text-surface-400" />
										<span class="font-mono text-sm">{tile.elevation.toFixed(3)}</span>
									</div>
								</td>
								<td class="p-3 text-center">
									<div class="flex items-center justify-center gap-1">
										<Droplets size={14} class="text-surface-400" />
										<span class="font-mono text-sm">{tile.precipitation.toFixed(3)}</span>
									</div>
								</td>
								<td class="p-3 text-center">
									<div class="flex items-center justify-center gap-1">
										<Thermometer size={14} class="text-surface-400" />
										<span class="font-mono text-sm">{tile.temperature.toFixed(3)}</span>
									</div>
								</td>
								<td class="p-3 text-center">
									<span class="font-semibold">{tile.plots?.length || 0}</span>
								</td>
								<td class="p-3 text-center">
									{#if hasSettlement}
										<div class="flex items-center justify-center gap-1">
											<Home size={14} class="text-warning-500" />
											<span class="font-semibold text-warning-500">Yes</span>
										</div>
									{:else}
										<span class="text-surface-400">—</span>
									{/if}
								</td>
								<td class="p-3 text-right">
									<a
										href="/admin/tiles/{tile.id}"
										class="btn btn-sm preset-filled-primary-500 rounded-md inline-flex items-center gap-1"
									>
										<span>View</span>
										<ArrowLeft size={14} class="rotate-180" />
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Summary Footer -->
			<div class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
				<p class="text-xs text-surface-600 dark:text-surface-400 text-center">
					Showing {data.region.tiles.length} tiles
					{#if data.region.tiles.some((t: TileWithRelations) => t.plots?.some((p: Plot) => p.Settlement))}
						• {data.region.tiles.filter((t: TileWithRelations) => t.plots?.some((p: Plot) => p.Settlement)).length} with settlements
					{/if}
				</p>
			</div>
		{/if}
	</div>

	<!-- Back Button -->
	<div>
		<a href="/admin/worlds/{data.region.worldId}" class="btn preset-tonal-surface-500 rounded-md">
			<ArrowLeft size={20} />
			<span>Back to {data.region.world.name}</span>
		</a>
	</div>
</div>
