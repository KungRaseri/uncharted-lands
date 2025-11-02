<script lang="ts">
	import type { PageData } from './$types';
	import { MapPin, Globe, Layers, ArrowLeft, Mountain, Droplets, Thermometer } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Dashboard</a>
		<span class="text-surface-400">/</span>
		<a href="/admin/regions" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Regions</a>
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

	<!-- Tiles Section -->
	<div class="card preset-filled-surface-100-900 p-6">
		<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
			<Layers size={24} />
			Tiles ({data.region.tiles.length})
		</h2>

		{#if data.region.tiles.length === 0}
			<div class="p-8 text-center">
				<Layers size={48} class="mx-auto mb-4 text-surface-400" />
				<p class="text-surface-600 dark:text-surface-400">No tiles in this region</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
				{#each data.region.tiles as tile}
					<a
						href="/admin/tiles/{tile.id}"
						class="card preset-tonal-surface-500 p-4 hover:preset-filled-primary-500 transition-colors"
					>
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<span class="badge preset-filled-surface-500 text-xs capitalize">
									{tile.type}
								</span>
							</div>
							
							<div class="space-y-1 text-xs">
								<div class="flex items-center gap-1">
									<Mountain size={12} class="text-surface-400" />
									<span>E: {(tile.elevation * 100).toPrecision(3)}</span>
								</div>
								<div class="flex items-center gap-1">
									<Droplets size={12} class="text-surface-400" />
									<span>P: {tile.precipitation.toPrecision(3)}</span>
								</div>
								<div class="flex items-center gap-1">
									<Thermometer size={12} class="text-surface-400" />
									<span>T: {tile.temperature.toPrecision(3)}</span>
								</div>
							</div>
							
							<p class="text-xs text-surface-600 dark:text-surface-400 font-mono truncate">
								{tile.id.substring(0, 8)}...
							</p>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Back Button -->
	<div>
		<a href="/admin/regions" class="btn preset-tonal-surface-500 rounded-md">
			<ArrowLeft size={20} />
			<span>Back to Regions</span>
		</a>
	</div>
</div>
