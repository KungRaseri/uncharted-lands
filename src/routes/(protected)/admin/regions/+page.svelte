<script lang="ts">
	import type { PageData } from './$types';
	import { MapPin, Search, ExternalLink, Globe, Server, Layers } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchTerm = $state('');
	
	let filteredRegions = $derived(data.regions.filter(region => {
		if (!searchTerm) return true;
		const search = searchTerm.toLowerCase();
		return (
			region.id.toLowerCase().includes(search) ||
			region.world.name.toLowerCase().includes(search) ||
			region.world.server.name.toLowerCase().includes(search)
		);
	}));
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold flex items-center gap-2">
				<MapPin size={28} />
				Regions
			</h1>
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
				View and manage world regions
			</p>
		</div>
	</div>

	<!-- Search Bar -->
	<div class="card preset-filled-surface-100-900 p-4">
		<div class="relative">
			<Search size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
			<input
				bind:value={searchTerm}
				type="search"
				placeholder="Search by region ID, world, or server..."
				class="input pl-10 w-full"
			/>
		</div>
		{#if searchTerm}
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-2">
				Found {filteredRegions.length} region{filteredRegions.length === 1 ? '' : 's'}
			</p>
		{/if}
	</div>

	<!-- Regions List -->
	<div class="card preset-filled-surface-100-900">
		{#if filteredRegions.length === 0}
			<div class="p-12 text-center">
				<MapPin size={48} class="mx-auto mb-4 text-surface-400" />
				<h3 class="text-xl font-semibold mb-2">
					{searchTerm ? 'No regions found' : 'No regions yet'}
				</h3>
				<p class="text-surface-600 dark:text-surface-400">
					{searchTerm ? 'Try a different search term' : 'Regions will appear here once worlds are generated'}
				</p>
			</div>
		{:else}
			<div class="table-container">
				<table class="table" aria-describedby="regions-header">
					<thead>
						<tr>
							<th>World</th>
							<th>Server</th>
							<th>Status</th>
							<th>Tiles</th>
							<th>Region ID</th>
							<th class="text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredRegions as region}
							<tr class="hover:preset-tonal-surface-500">
								<td>
									<div class="flex items-center gap-2">
										<Globe size={14} class="text-surface-400" />
										<span class="font-semibold">{region.world.name}</span>
									</div>
								</td>
								<td>
									<div class="flex items-center gap-2">
										<Server size={14} class="text-surface-400" />
										<span>{region.world.server.name}</span>
									</div>
								</td>
								<td>
									<span class="badge {region.world.server.status === 'ONLINE' 
										? 'preset-filled-success-500' 
										: 'preset-filled-error-500'}">
										{region.world.server.status}
									</span>
								</td>
								<td>
									<div class="flex items-center gap-2">
										<Layers size={14} class="text-surface-400" />
										<span>{region.tiles.length}</span>
									</div>
								</td>
								<td class="font-mono text-xs">{region.id}</td>
								<td class="text-right">
									<a
										href="/admin/regions/{region.id}"
										class="btn btn-sm preset-tonal-primary-500 rounded-md"
									>
										<ExternalLink size={16} />
										<span>View</span>
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<td colspan="6" class="text-center text-sm text-surface-600 dark:text-surface-400">
								Total Regions: {filteredRegions.length}
								{#if searchTerm}
									(filtered from {data.regions.length})
								{/if}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>
</div>
