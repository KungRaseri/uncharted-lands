<script lang="ts">
	import World from '$lib/components/game/map/World.svelte';
	import MapControls from '$lib/components/game/map/MapControls.svelte';
	import type { PageData } from './$types';
	import type { RegionWithTiles, TileWithRelations } from '@uncharted-lands/shared';
	import { Map, Globe, Layers, MapPin, Info } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	console.log('[MAP CLIENT] Page data received:', {
		hasWorld: !!data.world,
		worldName: data.world?.name,
		regionCount: data.world?.regions?.length,
		hasPlayerSettlement: !!data.playerSettlement,
		settlementName: data.playerSettlement?.name,
		lazyLoadEnabled: data.lazyLoadEnabled,
		initialBounds: data.initialRegionBounds
	});

	// State for lazy loading and panning
	let regions = $state(data.world?.regions || []);
	let currentBounds = $state(data.initialRegionBounds || { xMin: 4, xMax: 6, yMin: 4, yMax: 6 });
	let centerCoords = $state({
		x: data.playerSettlement?.regionCoords.x || 5,
		y: data.playerSettlement?.regionCoords.y || 5
	});
	let isLoading = $state(false);
	let loadedRegionKeys = $state(new Set<string>());

	// Initialize loaded region keys
	$effect(() => {
		if (regions.length > 0 && loadedRegionKeys.size === 0) {
			regions.forEach((r: RegionWithTiles) => loadedRegionKeys.add(`${r.xCoord},${r.yCoord}`));
		}
	});

	// Fetch regions from API and REPLACE the visible grid (not append)
	async function fetchRegions(centerX: number, centerY: number, radius: number = 1) {
		if (!data.world) return;

		isLoading = true;
		console.log('[MAP PAN] Fetching regions:', { centerX, centerY, radius });

		try {
			const response = await fetch(
				`/api/regions/${data.world.id}?centerX=${centerX}&centerY=${centerY}&radius=${radius}`
			);
			const result = await response.json();

			if (response.ok && result.regions) {
				console.log('[MAP PAN] Received regions:', result.count);
				console.log('[MAP PAN] Bounds:', result.bounds);

				// REPLACE the regions array with new grid (don't append)
				// This ensures we always show exactly 3×3 grid centered on new coordinates
				regions = result.regions;

				// Update loaded region keys (for potential future caching)
				loadedRegionKeys.clear();
				regions.forEach((r: RegionWithTiles) => {
					loadedRegionKeys.add(`${r.xCoord},${r.yCoord}`);
				});

				// Update current bounds
				currentBounds = result.bounds;

				console.log('[MAP PAN] Displaying regions:', regions.length);
				console.log(
					'[MAP PAN] Region coordinates:',
					regions.map((r: RegionWithTiles) => `(${r.xCoord},${r.yCoord})`).join(', ')
				);
			} else {
				console.error('[MAP PAN] Failed to fetch regions:', result.error);
			}
		} catch (error) {
			console.error('[MAP PAN] Error fetching regions:', error);
		} finally {
			isLoading = false;
		}
	}

	// Pan handlers
	// Note: xCoord = row (vertical), yCoord = column (horizontal)
	function handlePanUp() {
		centerCoords.x--; // Move up in rows (decrease xCoord)
		fetchRegions(centerCoords.x, centerCoords.y);
	}

	function handlePanDown() {
		centerCoords.x++; // Move down in rows (increase xCoord)
		fetchRegions(centerCoords.x, centerCoords.y);
	}

	function handlePanLeft() {
		centerCoords.y--; // Move left in columns (decrease yCoord)
		fetchRegions(centerCoords.x, centerCoords.y);
	}

	function handlePanRight() {
		centerCoords.y++; // Move right in columns (increase yCoord)
		fetchRegions(centerCoords.x, centerCoords.y);
	}

	function handleRecenter() {
		if (data.playerSettlement) {
			centerCoords = {
				x: data.playerSettlement.regionCoords.x,
				y: data.playerSettlement.regionCoords.y
			};
			// Reset regions to initial load
			regions = data.world?.regions || [];
			loadedRegionKeys = new Set(regions.map((r: RegionWithTiles) => `${r.xCoord},${r.yCoord}`));
			currentBounds = data.initialRegionBounds || currentBounds;
		}
	}

	function handleRefresh() {
		fetchRegions(centerCoords.x, centerCoords.y);
	}

	// Determine if can pan in each direction (world bounds 0-9)
	// Note: xCoord = row (vertical), yCoord = column (horizontal)
	const canPanUp = $derived(centerCoords.x > 1); // Can move up in rows
	const canPanDown = $derived(centerCoords.x < 8); // Can move down in rows
	const canPanLeft = $derived(centerCoords.y > 1); // Can move left in columns
	const canPanRight = $derived(centerCoords.y < 8); // Can move right in columns

	const totalRegions = $derived(regions.length || 0);

	const totalTiles = $derived(
		regions.reduce(
			(sum: number, region: RegionWithTiles) => sum + (region.tiles?.length || 0),
			0
		) || 0
	);

	const settledTiles = $derived(
		regions.reduce(
			(sum: number, region: RegionWithTiles) =>
				sum +
				(region.tiles?.filter((tile: TileWithRelations) => tile.settlementId !== null).length || 0),
			0
		) || 0
	);

	// Calculate world dimensions (from all loaded regions)
	const worldWidth = $derived(
		regions.length > 0 ? Math.max(...regions.map((r: RegionWithTiles) => r.xCoord)) + 1 : 10
	);

	const worldHeight = $derived(
		regions.length > 0 ? Math.max(...regions.map((r: RegionWithTiles) => r.yCoord)) + 1 : 10
	);
</script>

<svelte:head>
	<title>World Map | Uncharted Lands</title>
</svelte:head>

<div class="container mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex flex-col items-center gap-4 text-center">
		<div class="space-y-3">
			<h1
				class="text-3xl font-bold text-surface-900 dark:text-surface-100 flex items-center justify-center gap-2"
			>
				<Map size={32} class="text-primary-500" />
				World Map
			</h1>
			<div
				class="flex flex-wrap items-center justify-center gap-4 text-sm text-surface-600 dark:text-surface-400"
			>
				{#if data.world}
					<div class="flex items-center gap-2">
						<Globe size={16} />
						<span class="font-semibold">{data.world.name}</span>
					</div>
				{/if}
				<div class="flex items-center gap-2">
					<Layers size={16} />
					<span>{totalRegions} Regions ({worldWidth}×{worldHeight})</span>
				</div>
				<div class="flex items-center gap-2">
					<Map size={16} />
					<span>{totalTiles.toLocaleString()} Tiles</span>
				</div>
				{#if settledTiles > 0}
					<div class="flex items-center gap-2">
						<MapPin size={16} />
						<span class="text-warning-500 font-semibold">{settledTiles} Settled Tiles</span>
					</div>
				{/if}
			</div>

			{#if data.playerSettlement}
				<div class="card preset-filled-success-500 p-3 inline-flex items-center gap-2 text-sm">
					<MapPin size={16} />
					<span>
						Your settlement <strong>{data.playerSettlement.name}</strong> is at region ({data
							.playerSettlement.regionCoords.x}, {data.playerSettlement.regionCoords.y})
					</span>
				</div>
			{:else}
				<div class="card preset-filled-warning-500 p-3 inline-flex items-center gap-2 text-sm">
					<Info size={16} />
					<span>
						You don't have a settlement yet.
						<a href="/game/getting-started" class="underline font-semibold"
							>Create your first settlement</a
						>
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
					<p class="opacity-90">
						Hover over tiles to see details. Your settlement and other settled tiles are marked with
						yellow dots.
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Map Controls (only show if lazy loading is enabled) -->
	{#if data.lazyLoadEnabled}
		<div class="flex justify-center">
			<div class="card preset-filled-surface-100-900 p-4">
				<MapControls
					onPanUp={handlePanUp}
					onPanDown={handlePanDown}
					onPanLeft={handlePanLeft}
					onPanRight={handlePanRight}
					onRecenter={data.playerSettlement ? handleRecenter : undefined}
					onRefresh={handleRefresh}
					{canPanUp}
					{canPanDown}
					{canPanLeft}
					{canPanRight}
					{isLoading}
				/>
			</div>
		</div>

		<!-- Current View Info -->
		<div class="flex justify-center">
			<div class="card preset-filled-primary-500 p-3 text-sm">
				<p class="font-semibold">
					Viewing center: ({centerCoords.x}, {centerCoords.y}) | Loaded regions: {regions.length} | Current
					grid: ({currentBounds.xMin}-{currentBounds.xMax}, {currentBounds.yMin}-{currentBounds.yMax})
				</p>
			</div>
		</div>
	{/if}

	<!-- Map Container -->
	<div class="card preset-filled-surface-100-900 p-6">
		{#if data.world}
			<World
				{regions}
				playerProfileId={data.playerProfileId}
				lazyLoadEnabled={data.lazyLoadEnabled ?? false}
			/>
		{:else}
			<div class="p-12 text-center">
				<p class="text-lg text-surface-600 dark:text-surface-400">No world available</p>
			</div>
		{/if}
	</div>
</div>
