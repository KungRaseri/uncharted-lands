<script lang="ts">
	import type { PageData } from './$types';
	import { Globe, Plus, Search, ExternalLink, Server } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchTerm = $state('');
	
	let filteredWorlds = $derived(data.worlds.filter(world => {
		if (!searchTerm) return true;
		const search = searchTerm.toLowerCase();
		return (
			world.id.toLowerCase().includes(search) ||
			world.name.toLowerCase().includes(search) ||
			world.server.name.toLowerCase().includes(search)
		);
	}));
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold flex items-center gap-2">
				<Globe size={28} />
				Worlds
			</h1>
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
				Manage game worlds and their configurations
			</p>
		</div>
		<a href="/admin/worlds/create" class="btn preset-filled-primary-500 rounded-md">
			<Plus size={20} />
			<span>Create World</span>
		</a>
	</div>

	<!-- Search Bar -->
	<div class="card preset-filled-surface-100-900 p-4">
		<div class="relative">
			<Search size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
			<input
				bind:value={searchTerm}
				type="search"
				placeholder="Search by world name, ID, or server..."
				class="input pl-10 w-full"
			/>
		</div>
		{#if searchTerm}
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-2">
				Found {filteredWorlds.length} world{filteredWorlds.length === 1 ? '' : 's'}
			</p>
		{/if}
	</div>

	<!-- Worlds List -->
	<div class="card preset-filled-surface-100-900">
		{#if filteredWorlds.length === 0}
			<div class="p-12 text-center">
				<Globe size={48} class="mx-auto mb-4 text-surface-400" />
				<h3 class="text-xl font-semibold mb-2">
					{searchTerm ? 'No worlds found' : 'No worlds yet'}
				</h3>
				<p class="text-surface-600 dark:text-surface-400 mb-4">
					{searchTerm ? 'Try a different search term' : 'Create your first world to get started'}
				</p>
				{#if !searchTerm}
					<a href="/admin/worlds/create" class="btn preset-filled-primary-500 rounded-md">
						<Plus size={20} />
						<span>Create World</span>
					</a>
				{/if}
			</div>
		{:else}
			<div class="table-container">
				<table class="table" aria-describedby="worlds-header">
					<thead>
						<tr>
							<th>World Name</th>
							<th>Server</th>
							<th>Regions</th>
							<th>ID</th>
							<th class="text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredWorlds as world}
							<tr class="hover:preset-tonal-surface-500">
								<td class="font-semibold">{world.name}</td>
								<td>
									<div class="flex items-center gap-2">
										<Server size={14} class="text-surface-400" />
										<span>{world.server.name}</span>
									</div>
								</td>
								<td>{world.regions.length}</td>
								<td class="font-mono text-xs">{world.id}</td>
								<td class="text-right">
									<a
										href="/admin/worlds/{world.id}"
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
							<td colspan="5" class="text-center text-sm text-surface-600 dark:text-surface-400">
								Total Worlds: {filteredWorlds.length}
								{#if searchTerm}
									(filtered from {data.worlds.length})
								{/if}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>
</div>
