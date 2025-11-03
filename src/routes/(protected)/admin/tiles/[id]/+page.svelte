<script lang="ts">
	import type { PageData } from './$types';
	import { Layers, MapPin, Globe, Mountain, Droplets, Thermometer, Grid3x3, ArrowLeft, Home, Wind, Sun } from 'lucide-svelte';
	import TilePlotsPreview from '$lib/components/admin/TilePlotsPreview.svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Dashboard</a>
		<span class="text-surface-400">/</span>
		<a href="/admin/worlds" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Worlds</a>
		<span class="text-surface-400">/</span>
		<a href="/admin/worlds/{data.tile.Region.world.id}" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">{data.tile.Region.world.name}</a>
		<span class="text-surface-400">/</span>
		<span class="text-surface-600 dark:text-surface-400">Regions</span>
		<span class="text-surface-400">/</span>
		<a href="/admin/regions/{data.tile.Region.id}" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">{data.tile.Region.name}</a>
		<span class="text-surface-400">/</span>
		<span class="text-surface-600 dark:text-surface-400">Tiles</span>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">{data.tile.type} Tile</span>
	</div>

	<!-- Tile Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-start gap-6">
			<div class="flex-none w-16 h-16 rounded-full bg-success-500/10 flex items-center justify-center">
				<Layers size={32} class="text-success-500" />
			</div>

			<div class="flex-1">
				<h1 class="text-3xl font-bold mb-2 capitalize">{data.tile.type} Tile</h1>
				<p class="text-sm text-surface-600 dark:text-surface-400 font-mono mb-4">{data.tile.id}</p>
				
				<div class="flex flex-wrap gap-4">
					<div class="flex items-center gap-2">
						<MapPin size={16} class="text-surface-400" />
						<a href="/admin/regions/{data.tile.regionId}" class="text-primary-500 hover:underline text-sm">
							View Region
						</a>
					</div>
					<div class="flex items-center gap-2">
						<Globe size={16} class="text-surface-400" />
						<span class="text-sm">Biome: {data.tile.Biome.name}</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Tile with Plots Preview -->
	<TilePlotsPreview 
		tile={data.tile}
		tileName={`${data.tile.type.charAt(0).toUpperCase() + data.tile.type.slice(1)} Tile`}
		tileX={data.tileX}
		tileY={data.tileY}
	/>

	<!-- Tile Properties -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="card preset-filled-surface-100-900 p-6">
			<div class="flex items-center gap-3 mb-3">
				<div class="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center">
					<Mountain size={20} class="text-success-500" />
				</div>
				<h3 class="font-semibold">Elevation</h3>
			</div>
			<p class="text-2xl font-bold mb-1">{(data.tile.elevation * 100).toPrecision(3)}</p>
			<p class="text-xs text-surface-600 dark:text-surface-400 font-mono">Raw: {data.tile.elevation.toFixed(4)}</p>
		</div>

		<div class="card preset-filled-surface-100-900 p-6">
			<div class="flex items-center gap-3 mb-3">
				<div class="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
					<Droplets size={20} class="text-primary-500" />
				</div>
				<h3 class="font-semibold">Precipitation</h3>
			</div>
			<p class="text-2xl font-bold mb-1">{data.tile.precipitation.toPrecision(3)}</p>
			<p class="text-xs text-surface-600 dark:text-surface-400 font-mono">Raw: {data.tile.precipitation.toFixed(4)}</p>
		</div>

		<div class="card preset-filled-surface-100-900 p-6">
			<div class="flex items-center gap-3 mb-3">
				<div class="w-10 h-10 rounded-lg bg-error-500/10 flex items-center justify-center">
					<Thermometer size={20} class="text-error-500" />
				</div>
				<h3 class="font-semibold">Temperature</h3>
			</div>
			<p class="text-2xl font-bold mb-1">{data.tile.temperature.toPrecision(3)}</p>
			<p class="text-xs text-surface-600 dark:text-surface-400 font-mono">Raw: {data.tile.temperature.toFixed(4)}</p>
		</div>
	</div>

	<!-- Plots Section -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-bold flex items-center gap-2">
				<Grid3x3 size={24} />
				Plots ({data.tile.Plots.length})
			</h2>
			<div class="text-sm text-surface-600 dark:text-surface-400">
				Click a plot to view details
			</div>
		</div>

		{#if data.tile.Plots.length === 0}
			<div class="p-8 text-center">
				<Grid3x3 size={48} class="mx-auto mb-4 text-surface-400" />
				<p class="text-surface-600 dark:text-surface-400">No plots on this tile</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table-auto w-full">
					<thead>
						<tr class="border-b border-surface-300 dark:border-surface-600">
							<th class="text-left p-3 font-semibold text-sm">Plot ID</th>
							<th class="text-center p-3 font-semibold text-sm">Area</th>
							<th class="text-center p-3 font-semibold text-sm">Solar</th>
							<th class="text-center p-3 font-semibold text-sm">Wind</th>
							<th class="text-center p-3 font-semibold text-sm">Resources</th>
							<th class="text-center p-3 font-semibold text-sm">Settlement</th>
							<th class="text-right p-3 font-semibold text-sm">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.tile.Plots as plot}
							{@const hasSettlement = plot.Settlement}
							<tr class="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
								<td class="p-3">
									<p class="font-mono text-xs">{plot.id.substring(0, 12)}...</p>
								</td>
								<td class="p-3 text-center">
									<span class="font-semibold">{plot.area}</span>
									<span class="text-xs text-surface-600 dark:text-surface-400"> m²</span>
								</td>
								<td class="p-3 text-center">
									<div class="flex items-center justify-center gap-1">
										<Sun size={14} class="text-warning-500" />
										<span class="font-semibold">{plot.solar}</span>
									</div>
								</td>
								<td class="p-3 text-center">
									<div class="flex items-center justify-center gap-1">
										<Wind size={14} class="text-primary-500" />
										<span class="font-semibold">{plot.wind}</span>
									</div>
								</td>
								<td class="p-3 text-center">
									<div class="flex flex-wrap gap-1 justify-center">
										<span class="text-xs px-1.5 py-0.5 rounded bg-success-500/10 text-success-500" title="Food">🌾 {plot.food}</span>
										<span class="text-xs px-1.5 py-0.5 rounded bg-primary-500/10 text-primary-500" title="Water">💧 {plot.water}</span>
										<span class="text-xs px-1.5 py-0.5 rounded bg-warning-500/10 text-warning-500" title="Wood">🪵 {plot.wood}</span>
										<span class="text-xs px-1.5 py-0.5 rounded bg-surface-500/10 text-surface-900 dark:text-surface-50" title="Stone">🪨 {plot.stone}</span>
										<span class="text-xs px-1.5 py-0.5 rounded bg-error-500/10 text-error-500" title="Ore">⛏️ {plot.ore}</span>
									</div>
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
										href="/admin/plots/{plot.id}"
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
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
					<div>
						<p class="text-xs text-surface-600 dark:text-surface-400">Total Plots</p>
						<p class="font-semibold">{data.tile.Plots.length}</p>
					</div>
					<div>
						<p class="text-xs text-surface-600 dark:text-surface-400">Total Area</p>
						<p class="font-semibold">{data.tile.Plots.reduce((sum, p) => sum + p.area, 0)} m²</p>
					</div>
					<div>
						<p class="text-xs text-surface-600 dark:text-surface-400">With Settlements</p>
						<p class="font-semibold text-warning-500">{data.tile.Plots.filter((p) => p.Settlement).length}</p>
					</div>
					<div>
						<p class="text-xs text-surface-600 dark:text-surface-400">Total Resources</p>
						<p class="font-semibold">{data.tile.Plots.reduce((sum, p) => sum + p.food + p.water + p.wood + p.stone + p.ore, 0)}</p>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Back Button -->
	<div>
		<a href="/admin/regions/{data.tile.Region.id}" class="btn preset-tonal-surface-500 rounded-md">
			<ArrowLeft size={20} />
			<span>Back to {data.tile.Region.name}</span>
		</a>
	</div>
</div>
