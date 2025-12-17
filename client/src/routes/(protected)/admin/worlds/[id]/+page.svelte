<script lang="ts">
	import type { PageData } from './$types';
	import {
		Globe,
		Server,
		MapPin,
		Home,
		Mountain,
		Waves,
		ArrowLeft,
		Edit,
		Trash2,
		Save,
		X,
		Loader2,
		AlertCircle,
		RefreshCw
	} from 'lucide-svelte';
	import WorldMap from '$lib/components/shared/WorldMap.svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import type { TileWithRelations } from '$lib/types/api';

	let { data, form }: { data: PageData; form: any } = $props();

	// Guard: if world failed to load, show error (this shouldn't happen but satisfies TypeScript)
	if (!data.world) {
		throw new Error('World not found');
	}

	let isEditing = $state(false);
	let showDeleteConfirm = $state(false);
	let isDeleting = $state(false);

	// Edit form state
	let editName = $state(data.world.name);
	let editServerId = $state(data.world.serverId);

	// Generation state
	let isGenerating = $state(false);
	let generationError = $state<string | null>(null);
	let pollingInterval: ReturnType<typeof setInterval> | null = null;

	// Auto-enable edit mode if ?edit=true in URL
	// Auto-start generation if ?startGeneration=true in URL
	onMount(() => {
		if (page.url.searchParams.get('edit') === 'true') {
			startEdit();
		}

		// Check if we should start generation
		const startGeneration = page.url.searchParams.get('startGeneration') === 'true';
		const generationSettings = page.url.searchParams.get('settings');

		if (startGeneration && generationSettings) {
			try {
				const settings = JSON.parse(decodeURIComponent(generationSettings));
				triggerGeneration(settings);
			} catch (error) {
				console.error('Failed to parse generation settings:', error);
				generationError = 'Failed to start generation: Invalid settings';
			}
		}

		// Cleanup polling on unmount
		return () => {
			if (pollingInterval) {
				clearInterval(pollingInterval);
			}
		};
	});

	async function triggerGeneration(settings: any) {
		isGenerating = true;
		generationError = null;

		console.log('[WORLD DETAILS] Starting generation with settings:', settings);

		try {
			// Map the settings to what the API expects
			const apiSettings = {
				width: settings.width,
				height: settings.height,
				seed: settings.elevationSeed || settings.seed || Date.now(), // Use elevationSeed as the main seed
				elevationOptions: settings.elevationSettings || settings.elevationOptions,
				precipitationOptions:
					settings.precipitationSettings || settings.precipitationOptions,
				temperatureOptions: settings.temperatureSettings || settings.temperatureOptions
			};

			console.log('[WORLD DETAILS] Mapped API settings:', apiSettings);

			// Call the generate server action
			const formData = new FormData();
			formData.append('settings', JSON.stringify(apiSettings));

			console.log('[WORLD DETAILS] Calling generate action...');
			const response = await fetch(`?/generate`, {
				method: 'POST',
				body: formData
			});

			console.log('[WORLD DETAILS] Generate response:', response.status, response.ok);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('[WORLD DETAILS] Generate failed:', errorText);
				throw new Error('Failed to start generation');
			}

			const result = await response.text();
			console.log('[WORLD DETAILS] Generate result:', result);

			// Start polling for status
			console.log('[WORLD DETAILS] Starting polling...');
			startPolling();
		} catch (error) {
			console.error('Failed to start generation:', error);
			generationError = error instanceof Error ? error.message : 'Failed to start generation';
			isGenerating = false;
		}
	}

	function startPolling() {
		console.log('[WORLD DETAILS] Polling started');
		// Poll every 3 seconds
		pollingInterval = setInterval(async () => {
			try {
				console.log('[WORLD DETAILS] Polling - current status:', data.world?.status);
				// Invalidate all data to refetch the world
				await invalidateAll();

				console.log('[WORLD DETAILS] After invalidate - status:', data.world?.status);

				// Check world status
				if (data.world?.status === 'ready') {
					// Generation complete!
					console.log('[WORLD DETAILS] Generation complete!');
					isGenerating = false;
					if (pollingInterval) {
						clearInterval(pollingInterval);
						pollingInterval = null;
					}
				} else if (data.world?.status === 'failed') {
					// Generation failed
					console.log('[WORLD DETAILS] Generation failed!');
					isGenerating = false;
					generationError = 'World generation failed. Please try again.';
					if (pollingInterval) {
						clearInterval(pollingInterval);
						pollingInterval = null;
					}
				}
			} catch (error) {
				console.error('Polling error:', error);
			}
		}, 3000);
	}

	async function retryGeneration() {
		// Get the last used settings from the world
		const settings = {
			width: 10, // Default values - you might want to get these from somewhere
			height: 10,
			seed: data.world!.id.charCodeAt(0), // Use world ID as seed
			elevationOptions: data.world!.elevationSettings,
			precipitationOptions: data.world!.precipitationSettings,
			temperatureOptions: data.world!.temperatureSettings
		};

		await triggerGeneration(settings);
	}

	function startEdit() {
		editName = data.world!.name;
		editServerId = data.world!.serverId;
		isEditing = true;
	}

	function cancelEdit() {
		isEditing = false;
	}

	// Use the same region data as player mode (includes full tile/biome data)
	// Admin mode will show same colors but with more detailed tooltips
	const worldRegions = $derived((data.world!.regions || []) as any);
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
		<span class="font-semibold">{data.world.name}</span>
	</div>

	<!-- Generation Status Banner -->
	{#if isGenerating || data.world?.status === 'generating'}
		<div class="card preset-filled-primary-500 p-6">
			<div class="flex items-center gap-4">
				<Loader2 size={32} class="text-white animate-spin" />
				<div class="flex-1">
					<h3 class="text-xl font-bold text-white mb-1">Generating World...</h3>
					<p class="text-white/80 text-sm">
						This may take a few minutes. The page will update automatically when
						complete.
					</p>
				</div>
			</div>
		</div>
	{:else if generationError || data.world?.status === 'failed'}
		<div class="card preset-filled-error-500 p-6">
			<div class="flex items-center gap-4">
				<AlertCircle size={32} class="text-white" />
				<div class="flex-1">
					<h3 class="text-xl font-bold text-white mb-1">Generation Failed</h3>
					<p class="text-white/80 text-sm">
						{generationError ||
							'World generation encountered an error. Please try again.'}
					</p>
				</div>
				<button onclick={retryGeneration} class="btn preset-filled-surface-100 rounded-md">
					<RefreshCw size={16} />
					<span>Retry</span>
				</button>
			</div>
		</div>
	{:else if data.world?.status === 'pending'}
		<div class="card preset-filled-warning-500 p-6">
			<div class="flex items-center gap-4">
				<AlertCircle size={32} class="text-white" />
				<div class="flex-1">
					<h3 class="text-xl font-bold text-white mb-1">World Not Generated</h3>
					<p class="text-white/80 text-sm">
						This world record exists but has not been generated yet.
					</p>
				</div>
			</div>
		</div>
	{/if}

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
					<p class="text-sm text-surface-600 dark:text-surface-400 font-mono mb-4">
						{data.world.id}
					</p>

					<div class="flex items-center gap-2">
						<Server size={16} class="text-surface-400" />
						<a
							href="/admin/servers/{data.world!.serverId}"
							class="text-primary-500 hover:underline"
						>
							{data.world!.server?.name || 'Unknown Server'}
						</a>
					</div>
				</div>

				<div class="flex items-center gap-2">
					<button
						onclick={startEdit}
						class="btn btn-sm preset-filled-primary-500 rounded-md"
					>
						<Edit size={16} />
						<span>Edit</span>
					</button>
					<button
						onclick={() => (showDeleteConfirm = true)}
						class="btn btn-sm preset-filled-error-500 rounded-md"
					>
						<Trash2 size={16} />
						<span>Delete</span>
					</button>
				</div>
			</div>

			<!-- Success/Error Messages -->
			{#if form?.success}
				<div
					class="mt-4 p-4 bg-success-500/10 border border-success-500 rounded-lg text-success-500"
				>
					{form.message}
				</div>
			{:else if form?.message}
				<div
					class="mt-4 p-4 bg-error-500/10 border border-error-500 rounded-lg text-error-500"
				>
					{form.message}
				</div>
			{/if}
		{:else}
			<!-- Edit Mode -->
			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						isEditing = false;
					};
				}}
			>
				<div class="flex items-start gap-6">
					<div
						class="flex-none w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center"
					>
						<Globe size={32} class="text-primary-500" />
					</div>

					<div class="flex-1 space-y-4">
						<div>
							<h1 class="text-2xl font-bold mb-2">Edit World</h1>
							<p class="text-sm text-surface-600 dark:text-surface-400 font-mono">
								{data.world.id}
							</p>
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
						<button
							type="submit"
							class="btn btn-sm preset-filled-success-500 rounded-md"
						>
							<Save size={16} />
							<span>Save</span>
						</button>
						<button
							type="button"
							onclick={cancelEdit}
							class="btn btn-sm preset-tonal-surface-500 rounded-md"
						>
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
				<div
					class="mb-4 p-3 bg-warning-500/10 border border-warning-500 rounded-lg text-warning-500"
				>
					<p class="font-semibold">⚠️ Warning</p>
					<p class="text-sm mt-1">This will permanently delete:</p>
					<ul class="text-sm mt-2 list-disc list-inside">
						<li>{data.world!.regions?.length || 0} regions</li>
						<li>{data.worldInfo.landTiles + data.worldInfo.oceanTiles} tiles</li>
						<li>All plots on those tiles</li>
						<li>{data.worldInfo.settlements} settlements</li>
					</ul>
				</div>
				<p class="mb-6 text-sm text-error-500">This action cannot be undone!</p>

				<div class="flex gap-3 justify-end">
					<button
						onclick={() => (showDeleteConfirm = false)}
						class="btn preset-tonal-surface-500 rounded-md"
						disabled={isDeleting}
					>
						Cancel
					</button>
					<form
						method="POST"
						action="?/delete"
						use:enhance={() => {
							isDeleting = true;
							return async ({ update }) => {
								await update();
								isDeleting = false;
							};
						}}
					>
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
				<div
					class="w-12 h-12 rounded-lg bg-success-500/10 flex items-center justify-center"
				>
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
				<div
					class="w-12 h-12 rounded-lg bg-primary-500/10 flex items-center justify-center"
				>
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
				<div
					class="w-12 h-12 rounded-lg bg-warning-500/10 flex items-center justify-center"
				>
					<MapPin size={24} class="text-warning-500" />
				</div>
				<div>
					<p class="text-2xl font-bold">{data.world!.regions?.length || 0}</p>
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
	{#if worldRegions && worldRegions.length > 0}
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-xl font-bold mb-4">World Map</h2>
			<WorldMap
				regions={worldRegions}
				mode="admin"
				showLegend={true}
				mapViewMode="satellite"
			/>
		</div>
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
						{#each data.world!.regions as region}
							{@const tiles = region.tiles || []}
							{@const landTiles = tiles.filter(
								(t: TileWithRelations) => t.type === 'LAND'
							).length}
							{@const oceanTiles = tiles.filter(
								(t: TileWithRelations) => t.type === 'OCEAN'
							).length}
							{@const avgElevation =
								tiles.length > 0
									? tiles.reduce(
											(sum: number, t: TileWithRelations) =>
												sum + t.elevation,
											0
										) / tiles.length
									: 0}
							{@const settlements = tiles.filter(
								(t: TileWithRelations) => t.settlementId != null
							).length}
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
											<p class="font-semibold">
												{region.name || 'Unnamed Region'}
											</p>
											<p
												class="text-xs text-surface-600 dark:text-surface-400 font-mono"
											>
												{region.id.substring(0, 8)}...
											</p>
										</div>
									</div>
								</td>
								<td class="p-3 text-center">
									<span class="font-mono text-sm"
										>{region.xCoord}, {region.yCoord}</span
									>
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
									<span
										class="px-2 py-1 rounded text-xs font-semibold {elevationClass}"
									>
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
					Showing {data.world!.regions?.length || 0} regions with {(
						data.world!.regions || []
					).reduce((sum, r) => sum + (r.tiles?.length || 0), 0)} total tiles
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
