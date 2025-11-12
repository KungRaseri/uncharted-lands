<script lang="ts">
	import type { PageData } from './$types';
	import { Building2, Search, ExternalLink, User, Calendar, MapPin } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchTerm = $state('');

	let filteredSettlements = $derived(
		data.settlements.filter((settlement: any) => {
			if (!searchTerm) return true;
			const search = searchTerm.toLowerCase();
			return (
				settlement.id.toLowerCase().includes(search) ||
				settlement.name.toLowerCase().includes(search) ||
				(settlement.playerProfile?.username &&
					settlement.playerProfile.username.toLowerCase().includes(search))
			);
		})
	);
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold flex items-center gap-2">
				<Building2 size={28} />
				Settlements
			</h1>
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
				Manage all settlements in the game world
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
				placeholder="Search by settlement name, owner, or ID..."
				class="input pl-10 w-full"
			/>
		</div>
		{#if searchTerm}
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-2">
				Found {filteredSettlements.length} settlement{filteredSettlements.length === 1 ? '' : 's'}
			</p>
		{/if}
	</div>

	<!-- Settlements List -->
	<div class="card preset-filled-surface-100-900">
		{#if filteredSettlements.length === 0}
			<div class="p-12 text-center">
				<Building2 size={48} class="mx-auto mb-4 text-surface-400" />
				<h3 class="text-xl font-semibold mb-2">
					{searchTerm ? 'No settlements found' : 'No settlements yet'}
				</h3>
				<p class="text-surface-600 dark:text-surface-400">
					{searchTerm
						? 'Try a different search term'
						: 'Settlements will appear here once players create them'}
				</p>
			</div>
		{:else}
			<div class="table-container">
				<table class="table" aria-describedby="settlements-header">
					<thead>
						<tr>
							<th>Settlement</th>
							<th>Owner</th>
							<th>Structures</th>
							<th>Plots</th>
							<th>Created</th>
							<th class="text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredSettlements as settlement}
							<tr class="hover:preset-tonal-surface-500">
								<td>
									<div class="flex items-center gap-3">
										<div
											class="w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center"
										>
											<Building2 size={20} class="text-primary-500" />
										</div>
										<div>
											<p class="font-semibold">{settlement.name}</p>
											<p class="text-xs text-surface-600 dark:text-surface-400 font-mono">
												{settlement.id}
											</p>
										</div>
									</div>
								</td>
								<td>
									<div class="flex items-center gap-2">
										<User size={14} class="text-surface-400" />
										<span class="text-sm">{settlement.playerProfile?.username || 'Unknown'}</span>
									</div>
								</td>
								<td>
									<span class="badge preset-tonal-secondary-500">
										{settlement.structures?.length || 0}
									</span>
								</td>
								<td>
									<span class="badge preset-tonal-tertiary-500">
										{settlement.plot?.length || 0}
									</span>
								</td>
								<td>
									<div class="flex items-center gap-2 text-sm">
										<Calendar size={14} class="text-surface-400" />
										<span>{new Date(settlement.createdAt).toLocaleDateString()}</span>
									</div>
								</td>
								<td class="text-right">
									<a
										href="/admin/settlements/{settlement.id}"
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
								Total Settlements: {filteredSettlements.length}
								{#if searchTerm}
									(filtered from {data.settlements.length})
								{/if}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>
</div>
