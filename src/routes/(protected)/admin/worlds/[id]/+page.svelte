<script lang="ts">
	import type { PageData } from './$types';
	import { Globe, Server, MapPin, Home, Mountain, Waves, ArrowLeft, Edit, Trash2, Save, X } from 'lucide-svelte';
	import WorldMapPreview from '$lib/components/admin/WorldMapPreview.svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let { data, form }: { data: PageData; form: any } = $props();
	
	let isEditing = $state(false);
	let showDeleteConfirm = $state(false);
	let isDeleting = $state(false);
	
	// Edit form state
	let editName = $state(data.world.name);
	let editServerId = $state(data.world.serverId);
	
	// Auto-enable edit mode if ?edit=true in URL
	onMount(() => {
		if ($page.url.searchParams.get('edit') === 'true') {
			startEdit();
		}
	});
	
	function startEdit() {
		editName = data.world.name;
		editServerId = data.world.serverId;
		isEditing = true;
	}
	
	function cancelEdit() {
		isEditing = false;
	}

	// Transform database regions into preview format
	const previewRegions = $derived(
		data.world.regions.map((region) => {
			// Group tiles into a 10x10 grid for elevation, precipitation, and temperature
			const elevationMap: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
			const precipitationMap: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));
			const temperatureMap: number[][] = Array.from({ length: 10 }, () => Array(10).fill(0));

			// Sort tiles to ensure correct positioning
			const sortedTiles = [...region.tiles].sort((a, b) => {
				// Assuming tiles are stored in row-major order
				return a.id.localeCompare(b.id);
			});

			// Fill the maps with tile data
			sortedTiles.forEach((tile, index) => {
				const row = Math.floor(index / 10);
				const col = index % 10;
				if (row < 10 && col < 10) {
					elevationMap[row][col] = tile.elevation;
					precipitationMap[row][col] = tile.precipitation;
					temperatureMap[row][col] = tile.temperature;
				}
			});

			return {
				id: region.id,
				worldId: region.worldId,
				xCoord: region.xCoord,
				yCoord: region.yCoord,
				name: region.name,
				elevationMap,
				precipitationMap,
				temperatureMap
			};
		})
	);
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
		{#if !isEditing}
			<!-- View Mode -->
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

				<div class="flex items-center gap-2">
					<button onclick={startEdit} class="btn btn-sm preset-filled-primary-500 rounded-md">
						<Edit size={16} />
						<span>Edit</span>
					</button>
					<button 
						onclick={() => showDeleteConfirm = true} 
						class="btn btn-sm preset-filled-error-500 rounded-md"
					>
						<Trash2 size={16} />
						<span>Delete</span>
					</button>
				</div>
			</div>

			<!-- Success/Error Messages -->
			{#if form?.success}
				<div class="mt-4 p-4 bg-success-500/10 border border-success-500 rounded-lg text-success-500">
					{form.message}
				</div>
			{:else if form?.message}
				<div class="mt-4 p-4 bg-error-500/10 border border-error-500 rounded-lg text-error-500">
					{form.message}
				</div>
			{/if}
		{:else}
			<!-- Edit Mode -->
			<form method="POST" action="?/update" use:enhance={() => {
				return async ({ update }) => {
					await update();
					isEditing = false;
				};
			}}>
				<div class="flex items-start gap-6">
					<div
						class="flex-none w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center"
					>
						<Globe size={32} class="text-primary-500" />
					</div>

					<div class="flex-1 space-y-4">
						<div>
							<h1 class="text-2xl font-bold mb-2">Edit World</h1>
							<p class="text-sm text-surface-600 dark:text-surface-400 font-mono">{data.world.id}</p>
						</div>

						<label class="label">
							<span class="label-text">World Name *</span>
							<input 
								type="text" 
								name="name" 
								bind:value={editName}
								class="input preset-filled-surface-200-700" 
								required 
							/>
						</label>

						<label class="label">
							<span class="label-text flex items-center gap-2">
								<Server size={16} />
								Server *
							</span>
							<select 
								name="serverId" 
								bind:value={editServerId}
								class="select preset-filled-surface-200-700"
								required
							>
								{#each data.servers as server}
									<option value={server.id}>
										{server.name} ({server.hostname}:{server.port})
									</option>
								{/each}
							</select>
							<p class="text-xs text-surface-500 dark:text-surface-400 mt-1">
								Reassign this world to a different server
							</p>
						</label>
					</div>

					<div class="flex items-center gap-2">
						<button type="submit" class="btn btn-sm preset-filled-success-500 rounded-md">
							<Save size={16} />
							<span>Save</span>
						</button>
						<button type="button" onclick={cancelEdit} class="btn btn-sm preset-tonal-surface-500 rounded-md">
							<X size={16} />
							<span>Cancel</span>
						</button>
					</div>
				</div>
			</form>
		{/if}
	</div>

	<!-- Delete Confirmation Modal -->
	{#if showDeleteConfirm}
		<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div class="card preset-filled-surface-100-900 p-6 max-w-md w-full">
				<h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-error-500">
					<Trash2 size={24} />
					Delete World?
				</h3>
				<p class="mb-4 text-surface-600 dark:text-surface-400">
					Are you sure you want to delete <strong>{data.world.name}</strong>?
				</p>
				<div class="mb-4 p-3 bg-warning-500/10 border border-warning-500 rounded-lg text-warning-500">
					<p class="font-semibold">⚠️ Warning</p>
					<p class="text-sm mt-1">This will permanently delete:</p>
					<ul class="text-sm mt-2 list-disc list-inside">
						<li>{data.world.regions.length} regions</li>
						<li>{data.worldInfo.landTiles + data.worldInfo.oceanTiles} tiles</li>
						<li>All plots on those tiles</li>
						<li>{data.worldInfo.settlements} settlements</li>
					</ul>
				</div>
				<p class="mb-6 text-sm text-error-500">
					This action cannot be undone!
				</p>

				<div class="flex gap-3 justify-end">
					<button 
						onclick={() => showDeleteConfirm = false} 
						class="btn preset-tonal-surface-500 rounded-md"
						disabled={isDeleting}
					>
						Cancel
					</button>
					<form method="POST" action="?/delete" use:enhance={() => {
						isDeleting = true;
						return async ({ update }) => {
							await update();
							isDeleting = false;
						};
					}}>
						<button 
							type="submit" 
							class="btn preset-filled-error-500 rounded-md"
							disabled={isDeleting}
						>
							{#if isDeleting}
								Deleting...
							{:else}
								<Trash2 size={16} />
								<span>Delete World</span>
							{/if}
						</button>
					</form>
				</div>
			</div>
		</div>
	{/if}

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
	{#if previewRegions && previewRegions.length > 0}
		<WorldMapPreview regions={previewRegions} />
	{/if}

	<!-- Regions List -->
	{#if data.world.regions && data.world.regions.length > 0}
		<div class="card preset-filled-surface-100-900 p-6">
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-xl font-bold flex items-center gap-2">
					<MapPin size={24} />
					Regions ({data.world.regions.length})
				</h2>
				<div class="text-sm text-surface-600 dark:text-surface-400">
					Click a region to view details
				</div>
			</div>

			<div class="overflow-x-auto">
				<table class="table-auto w-full">
					<thead>
						<tr class="border-b border-surface-300 dark:border-surface-600">
							<th class="text-left p-3 font-semibold text-sm">Region</th>
							<th class="text-center p-3 font-semibold text-sm">Coordinates</th>
							<th class="text-center p-3 font-semibold text-sm">Land Tiles</th>
							<th class="text-center p-3 font-semibold text-sm">Ocean Tiles</th>
							<th class="text-center p-3 font-semibold text-sm">Avg Elevation</th>
							<th class="text-center p-3 font-semibold text-sm">Settlements</th>
							<th class="text-right p-3 font-semibold text-sm">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.world.regions as region}
							{@const landTiles = region.tiles.filter((t) => t.type === 'LAND').length}
							{@const oceanTiles = region.tiles.filter((t) => t.type === 'OCEAN').length}
							{@const avgElevation = region.tiles.reduce((sum, t) => sum + t.elevation, 0) / region.tiles.length}
							{@const settlements = region.tiles.flatMap((t) => t.Plots).filter((p) => p.Settlement).length}
							{@const elevationClass =
								avgElevation < 0
									? 'bg-primary-500/10 text-primary-500'
									: avgElevation < 0.5
										? 'bg-success-500/10 text-success-500'
										: avgElevation < 0.8
											? 'bg-warning-500/10 text-warning-500'
											: 'bg-error-500/10 text-error-500'}
							<tr
								class="border-b border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
							>
								<td class="p-3">
									<div class="flex items-center gap-3">
										<div
											class="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
											style="background-color: {avgElevation < 0
												? '#003d66'
												: avgElevation < 0.3
													? '#7cb342'
													: avgElevation < 0.7
														? '#8d6e63'
														: '#757575'}"
										>
											{region.xCoord}:{region.yCoord}
										</div>
										<div>
											<p class="font-semibold">{region.name || 'Unnamed Region'}</p>
											<p class="text-xs text-surface-600 dark:text-surface-400 font-mono">
												{region.id.substring(0, 8)}...
											</p>
										</div>
									</div>
								</td>
								<td class="p-3 text-center">
									<span class="font-mono text-sm">{region.xCoord}, {region.yCoord}</span>
								</td>
								<td class="p-3 text-center">
									<div class="flex items-center justify-center gap-1">
										<Mountain size={14} class="text-success-500" />
										<span class="font-semibold">{landTiles}</span>
									</div>
								</td>
								<td class="p-3 text-center">
									<div class="flex items-center justify-center gap-1">
										<Waves size={14} class="text-primary-500" />
										<span class="font-semibold">{oceanTiles}</span>
									</div>
								</td>
								<td class="p-3 text-center">
									<span class="px-2 py-1 rounded text-xs font-semibold {elevationClass}">
										{avgElevation.toFixed(2)}
									</span>
								</td>
								<td class="p-3 text-center">
									{#if settlements > 0}
										<div class="flex items-center justify-center gap-1">
											<Home size={14} class="text-warning-500" />
											<span class="font-semibold">{settlements}</span>
										</div>
									{:else}
										<span class="text-surface-400">—</span>
									{/if}
								</td>
								<td class="p-3 text-right">
									<a
										href="/admin/regions/{region.id}"
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

			<!-- Grid view toggle option (optional) -->
			<div class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
				<p class="text-xs text-surface-600 dark:text-surface-400 text-center">
					Showing {data.world.regions.length} regions with {data.world.regions.reduce(
						(sum, r) => sum + r.tiles.length,
						0
					)} total tiles
				</p>
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
