<script lang="ts">
	import type { PageData } from './$types';
	import {
		Layers,
		MapPin,
		Globe,
		Mountain,
		Droplets,
		Thermometer,
		ArrowLeft
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>Dashboard</a
		>
		<span class="text-surface-400">/</span>
		<a
			href="/admin/worlds"
			class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Worlds</a
		>
		<span class="text-surface-400">/</span>
		<a
			href="/admin/worlds/{data.tile.Region.world.id}"
			class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>{data.tile.Region.world.name}</a
		>
		<span class="text-surface-400">/</span>
		<span class="text-surface-600 dark:text-surface-400">Regions</span>
		<span class="text-surface-400">/</span>
		<a
			href="/admin/regions/{data.tile.Region.id}"
			class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>{data.tile.Region.name}</a
		>
		<span class="text-surface-400">/</span>
		<span class="text-surface-600 dark:text-surface-400">Tiles</span>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">{data.tile.type} Tile</span>
	</div>

	<!-- Tile Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-start gap-6">
			<div
				class="flex-none w-16 h-16 rounded-full bg-success-500/10 flex items-center justify-center"
			>
				<Layers size={32} class="text-success-500" />
			</div>

			<div class="flex-1">
				<h1 class="text-3xl font-bold mb-2 capitalize">{data.tile.type} Tile</h1>
				<p class="text-sm text-surface-600 dark:text-surface-400 font-mono mb-4">
					{data.tile.id}
				</p>

				<div class="flex flex-wrap gap-4">
					<div class="flex items-center gap-2">
						<MapPin size={16} class="text-surface-400" />
						<a
							href="/admin/regions/{data.tile.regionId}"
							class="text-primary-500 hover:underline text-sm"
						>
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

	<!-- Tile Properties -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div class="card preset-filled-surface-100-900 p-6">
			<div class="flex items-center gap-3 mb-3">
				<div
					class="w-10 h-10 rounded-lg bg-success-500/10 flex items-center justify-center"
				>
					<Mountain size={20} class="text-success-500" />
				</div>
				<h3 class="font-semibold">Elevation</h3>
			</div>
			<p class="text-2xl font-bold mb-1">{(data.tile.elevation * 100).toPrecision(3)}</p>
			<p class="text-xs text-surface-600 dark:text-surface-400 font-mono">
				Raw: {data.tile.elevation.toFixed(4)}
			</p>
		</div>

		<div class="card preset-filled-surface-100-900 p-6">
			<div class="flex items-center gap-3 mb-3">
				<div
					class="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center"
				>
					<Droplets size={20} class="text-primary-500" />
				</div>
				<h3 class="font-semibold">Precipitation</h3>
			</div>
			<p class="text-2xl font-bold mb-1">{data.tile.precipitation.toPrecision(3)}</p>
			<p class="text-xs text-surface-600 dark:text-surface-400 font-mono">
				Raw: {data.tile.precipitation.toFixed(4)}
			</p>
		</div>

		<div class="card preset-filled-surface-100-900 p-6">
			<div class="flex items-center gap-3 mb-3">
				<div class="w-10 h-10 rounded-lg bg-error-500/10 flex items-center justify-center">
					<Thermometer size={20} class="text-error-500" />
				</div>
				<h3 class="font-semibold">Temperature</h3>
			</div>
			<p class="text-2xl font-bold mb-1">{data.tile.temperature.toPrecision(3)}</p>
			<p class="text-xs text-surface-600 dark:text-surface-400 font-mono">
				Raw: {data.tile.temperature.toFixed(4)}
			</p>
		</div>
	</div>

	<!-- Back Button -->
	<div>
		<a
			href="/admin/regions/{data.tile.Region.id}"
			class="btn preset-tonal-surface-500 rounded-md"
		>
			<ArrowLeft size={20} />
			<span>Back to {data.tile.Region.name}</span>
		</a>
	</div>
</div>
