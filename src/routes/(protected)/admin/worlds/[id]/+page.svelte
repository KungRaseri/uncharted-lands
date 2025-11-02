<script lang="ts">
	import type { PageData } from './$types';
	import { Globe, Server, MapPin, Home, Mountain, Waves, ArrowLeft } from 'lucide-svelte';
	import World from '$lib/components/game/map/World.svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>Dashboard</a
		>
		<span class="text-surface-400">/</span>
		<a href="/admin/worlds" class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>Worlds</a
		>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">{data.world.name}</span>
	</div>

	<!-- World Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-start gap-6">
			<div
				class="flex-none w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center"
			>
				<Globe size={32} class="text-primary-500" />
			</div>

			<div class="flex-1">
				<h1 class="text-3xl font-bold mb-2">{data.world.name}</h1>
				<p class="text-sm text-surface-600 dark:text-surface-400 font-mono mb-4">{data.world.id}</p>

				<div class="flex items-center gap-2">
					<Server size={16} class="text-surface-400" />
					<a href="/admin/servers/{data.world.serverId}" class="text-primary-500 hover:underline">
						{data.world.server.name}
					</a>
				</div>
			</div>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="card preset-filled-surface-100-900 p-4">
			<div class="flex items-center gap-3">
				<div class="w-12 h-12 rounded-lg bg-success-500/10 flex items-center justify-center">
					<Mountain size={24} class="text-success-500" />
				</div>
				<div>
					<p class="text-2xl font-bold">{data.worldInfo.landTiles}</p>
					<p class="text-sm text-surface-600 dark:text-surface-400">Land Tiles</p>
				</div>
			</div>
		</div>

		<div class="card preset-filled-surface-100-900 p-4">
			<div class="flex items-center gap-3">
				<div class="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center">
					<Waves size={24} class="text-primary-500" />
				</div>
				<div>
					<p class="text-2xl font-bold">{data.worldInfo.oceanTiles}</p>
					<p class="text-sm text-surface-600 dark:text-surface-400">Ocean Tiles</p>
				</div>
			</div>
		</div>

		<div class="card preset-filled-surface-100-900 p-4">
			<div class="flex items-center gap-3">
				<div class="w-12 h-12 rounded-lg bg-warning-500/10 flex items-center justify-center">
					<MapPin size={24} class="text-warning-500" />
				</div>
				<div>
					<p class="text-2xl font-bold">{data.world.regions.length}</p>
					<p class="text-sm text-surface-600 dark:text-surface-400">Regions</p>
				</div>
			</div>
		</div>

		<div class="card preset-filled-surface-100-900 p-4">
			<div class="flex items-center gap-3">
				<div class="w-12 h-12 rounded-lg bg-error-500/10 flex items-center justify-center">
					<Home size={24} class="text-error-500" />
				</div>
				<div>
					<p class="text-2xl font-bold">{data.worldInfo.settlements}</p>
					<p class="text-sm text-surface-600 dark:text-surface-400">Settlements</p>
				</div>
			</div>
		</div>
	</div>

	<!-- World Map -->
	{#if data.world.regions && data.world.regions.length > 0}
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-xl font-bold mb-4">World Map</h2>
			<World regions={data.world.regions} />
		</div>
	{/if}

	<!-- Regions List -->
	{#if data.world.regions && data.world.regions.length > 0}
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
				<MapPin size={24} />
				Regions ({data.world.regions.length})
			</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each data.world.regions as region}
					<a
						href="/admin/regions/{region.id}"
						class="card preset-tonal-surface-500 p-4 hover:preset-filled-primary-500 transition-colors"
					>
						<div class="flex items-start justify-between">
							<div>
								<p class="font-semibold mb-1">{region.name || 'Unnamed Region'}</p>
								<p class="text-xs text-surface-600 dark:text-surface-400 font-mono">{region.id}</p>
							</div>
							<MapPin size={20} class="text-surface-400" />
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Back Button -->
	<div>
		<a href="/admin/worlds" class="btn preset-tonal-surface-500 rounded-md">
			<ArrowLeft size={20} />
			<span>Back to Worlds</span>
		</a>
	</div>
</div>
