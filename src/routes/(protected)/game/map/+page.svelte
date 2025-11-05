<script lang="ts">
	import World from '$lib/components/game/map/World.svelte';
	import type { PageData } from './$types';
	import { Map, Globe, Layers, MapPin, Info } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	
	console.log('[MAP CLIENT] Page data received:', {
		hasWorld: !!data.world,
		worldName: data.world?.name,
		regionCount: data.world?.regions?.length,
		hasPlayerSettlement: !!data.playerSettlement,
		settlementName: data.playerSettlement?.name
	});
	
	const totalRegions = $derived(data.world.regions?.length || 0);
	
	const totalTiles = $derived(
		data.world.regions?.reduce((sum, region) => sum + (region.tiles?.length || 0), 0) || 0
	);
	
	const settledPlots = $derived(
		data.world.regions?.reduce(
			(sum, region) => sum + (region.tiles?.reduce(
				(tileSum, tile) => tileSum + (tile.Plots?.filter(plot => plot.Settlement !== null).length || 0), 0
			) || 0), 0
		) || 0
	);
	
	// Calculate world dimensions
	const worldWidth = $derived(
		data.world.regions && data.world.regions.length > 0
			? Math.max(...data.world.regions.map(r => r.xCoord)) + 1
			: 0
	);
	
	const worldHeight = $derived(
		data.world.regions && data.world.regions.length > 0
			? Math.max(...data.world.regions.map(r => r.yCoord)) + 1
			: 0
	);
</script>

<svelte:head>
	<title>World Map | Uncharted Lands</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex flex-col items-center gap-4 text-center">
		<div class="space-y-3">
			<h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 flex items-center justify-center gap-2">
				<Map size={32} class="text-primary-500" />
				World Map
			</h1>
			<div class="flex flex-wrap items-center justify-center gap-4 text-sm text-surface-600 dark:text-surface-400">
				<div class="flex items-center gap-2">
					<Globe size={16} />
					<span class="font-semibold">{data.world.name}</span>
				</div>
				<div class="flex items-center gap-2">
					<Layers size={16} />
					<span>{totalRegions} Regions ({worldWidth}×{worldHeight})</span>
				</div>
				<div class="flex items-center gap-2">
					<Map size={16} />
					<span>{totalTiles.toLocaleString()} Tiles</span>
				</div>
				{#if settledPlots > 0}
					<div class="flex items-center gap-2">
						<MapPin size={16} />
						<span class="text-warning-500 font-semibold">{settledPlots} Settled Plots</span>
					</div>
				{/if}
			</div>
			
			{#if data.playerSettlement}
				<div class="card preset-filled-success-500 p-3 inline-flex items-center gap-2 text-sm">
					<MapPin size={16} />
					<span>
						Your settlement <strong>{data.playerSettlement.name}</strong> is at region 
						({data.playerSettlement.regionCoords.x}, {data.playerSettlement.regionCoords.y})
					</span>
				</div>
			{:else}
				<div class="card preset-filled-warning-500 p-3 inline-flex items-center gap-2 text-sm">
					<Info size={16} />
					<span>
						You don't have a settlement yet. 
						<a href="/game/getting-started" class="underline font-semibold">Create your first settlement</a>
					</span>
				</div>
			{/if}
		</div>
	</div>
	
	<!-- Info Card -->
	<div class="flex justify-center">
		<div class="card preset-filled-primary-500 p-4 max-w-md">
			<div class="flex gap-3">
				<Info size={20} class="shrink-0 mt-0.5" />
				<div class="text-sm">
					<p class="font-semibold mb-1">Interactive Map</p>
					<p class="opacity-90">Hover over tiles to see details. Your settlement and other settled plots are marked with yellow dots.</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Map Container -->
	<div class="card preset-filled-surface-100-900 p-6">
		<World 
			regions={data.world.regions ?? []} 
			playerProfileId={data.playerProfileId}
			lazyLoadEnabled={data.lazyLoadEnabled ?? false}
		/>
	</div>
</div>
