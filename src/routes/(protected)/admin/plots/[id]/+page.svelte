<script lang="ts">
	import type { PageData } from './$types';
	import { Grid3x3, Layers, Home, Sun, Wind, Beef, Droplet, Trees, Mountain as Rock, Gem, ArrowLeft, Globe, MapPin, Thermometer } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const resourceIcons: Record<string, any> = {
		area: Grid3x3,
		solar: Sun,
		wind: Wind,
		food: Beef,
		water: Droplet,
		wood: Trees,
		stone: Rock,
		ore: Gem
	};
</script>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Dashboard</a>
		<span class="text-surface-400">/</span>
		<a href="/admin/worlds" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Worlds</a>
		<span class="text-surface-400">/</span>
		<a href="/admin/worlds/{data.plot.Tile.Region.world.id}" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">{data.plot.Tile.Region.world.name}</a>
		<span class="text-surface-400">/</span>
		<span class="text-surface-600 dark:text-surface-400">Regions</span>
		<span class="text-surface-400">/</span>
		<a href="/admin/regions/{data.plot.Tile.Region.id}" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">{data.plot.Tile.Region.name}</a>
		<span class="text-surface-400">/</span>
		<span class="text-surface-600 dark:text-surface-400">Tiles</span>
		<span class="text-surface-400">/</span>
		<a href="/admin/tiles/{data.plot.Tile.id}" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">{data.plot.Tile.type} Tile</a>
		<span class="text-surface-400">/</span>
		<span class="text-surface-600 dark:text-surface-400">Plots</span>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">Plot</span>
	</div>

	<!-- Plot Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-start gap-6">
			<div class="flex-none w-16 h-16 rounded-full bg-warning-500/10 flex items-center justify-center">
				<Grid3x3 size={32} class="text-warning-500" />
			</div>

			<div class="flex-1">
				<h1 class="text-3xl font-bold mb-2">Plot</h1>
				<p class="text-sm text-surface-600 dark:text-surface-400 font-mono mb-4">{data.plot.id}</p>
				
				<div class="flex flex-wrap gap-4">
					<div class="flex items-center gap-2">
						<Layers size={16} class="text-surface-400" />
						<a href="/admin/tiles/{data.plot.tileId}" class="text-primary-500 hover:underline text-sm">
							View Tile
						</a>
					</div>
					{#if data.plot.Settlement}
						<div class="flex items-center gap-2">
							<Home size={16} class="text-surface-400" />
							<span class="text-sm">Has Settlement</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Resources Grid -->
	<div class="card preset-filled-surface-100-900 p-6">
		<h2 class="text-xl font-bold mb-4">Resources</h2>
		
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
			{#each [
				{ key: 'area', label: 'Area', value: data.plot.area, color: 'primary' },
				{ key: 'solar', label: 'Solar', value: data.plot.solar, color: 'warning' },
				{ key: 'wind', label: 'Wind', value: data.plot.wind, color: 'primary' },
				{ key: 'food', label: 'Food', value: data.plot.food, color: 'success' },
				{ key: 'water', label: 'Water', value: data.plot.water, color: 'primary' },
				{ key: 'wood', label: 'Wood', value: data.plot.wood, color: 'success' },
				{ key: 'stone', label: 'Stone', value: data.plot.stone, color: 'surface' },
				{ key: 'ore', label: 'Ore', value: data.plot.ore, color: 'warning' }
			] as resource}
				{@const IconComponent = resourceIcons[resource.key]}
				<div class="card preset-tonal-surface-500 p-4">
					<div class="flex items-center gap-3 mb-2">
						<div class="w-8 h-8 rounded-lg bg-{resource.color}-500/10 flex items-center justify-center">
							<IconComponent size={16} class="text-{resource.color}-500" />
						</div>
						<span class="text-sm font-semibold">{resource.label}</span>
					</div>
					<p class="text-xl font-bold">{resource.value}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Tile Information -->
	<div class="card preset-filled-surface-100-900 p-6">
		<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
			<Layers size={24} />
			Tile Information
		</h2>
		
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">Biome</div>
				<p class="font-semibold flex items-center gap-2">
					<Globe size={16} />
					{data.plot.Tile.Biome.name}
				</p>
			</div>

			<div>
				<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">Type</div>
				<p class="font-semibold capitalize">{data.plot.Tile.type}</p>
			</div>

			<div>
				<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">Elevation</div>
				<p class="font-semibold">{(data.plot.Tile.elevation * 100).toPrecision(3)}</p>
			</div>

			<div>
				<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">Precipitation</div>
				<p class="font-semibold">{data.plot.Tile.precipitation.toPrecision(3)}</p>
			</div>

			<div>
				<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">Temperature</div>
				<p class="font-semibold">{data.plot.Tile.temperature.toPrecision(3)}</p>
			</div>

			<div>
				<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">Tile ID</div>
				<p class="font-mono text-xs">{data.plot.Tile.id}</p>
			</div>
		</div>
	</div>

	<!-- Settlement Information -->
	{#if data.plot.Settlement}
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
				<Home size={24} />
				Settlement Information
			</h2>
			
			<div class="space-y-2">
				<div>
					<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">Settlement ID</div>
					<p class="font-mono text-sm">{data.plot.Settlement.id}</p>
				</div>
			</div>
		</div>
	{:else}
		<div class="card preset-filled-surface-100-900 p-6">
			<div class="p-8 text-center">
				<Home size={48} class="mx-auto mb-4 text-surface-400" />
				<h3 class="text-xl font-semibold mb-2">No Settlement</h3>
				<p class="text-surface-600 dark:text-surface-400">This plot does not have a settlement</p>
			</div>
		</div>
	{/if}

	<!-- Back Button -->
	<div>
		<a href="/admin/tiles/{data.plot.Tile.id}" class="btn preset-tonal-surface-500 rounded-md">
			<ArrowLeft size={20} />
			<span>Back to {data.plot.Tile.type} Tile</span>
		</a>
	</div>
</div>
