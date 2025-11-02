<script lang="ts">
	import type { PageData } from './$types';
	import { Server, Plus, ExternalLink } from 'lucide-svelte';
	import PageHeader from '$lib/components/admin/PageHeader.svelte';
	import EmptyState from '$lib/components/admin/EmptyState.svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-4">
	<!-- Header -->
	<PageHeader 
		title="Servers" 
		description="Manage game servers and their configurations"
		icon={Server}
	>
		{#snippet actions()}
			<a href="/admin/servers/create" class="btn preset-filled-primary-500 rounded-md">
				<Plus size={20} />
				<span>Create Server</span>
			</a>
		{/snippet}
	</PageHeader>

	<!-- Servers List -->
	<div class="card preset-filled-surface-100-900">
		{#if data.servers.length === 0}
			<EmptyState 
				icon={Server}
				title="No servers yet"
				message="Create your first server to get started"
				actionHref="/admin/servers/create"
				actionText="Create Server"
				actionIcon={Plus}
			/>
		{:else}
			<div class="table-container">
				<table class="table" aria-describedby="servers-header">
					<thead>
						<tr>
							<th>ID</th>
							<th>Name</th>
							<th>Host</th>
							<th>Port</th>
							<th>Status</th>
							<th>Worlds</th>
							<th class="text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.servers as server}
							<tr class="hover:preset-tonal-surface-500">
								<td class="font-mono text-xs">{server.id}</td>
								<td class="font-semibold">{server.name}</td>
								<td>{server.host || 'N/A'}</td>
								<td>{server.port || 'N/A'}</td>
								<td>
									<span class="badge preset-filled-success-500">Active</span>
								</td>
								<td>{server._count?.worlds || 0}</td>
								<td class="text-right">
									<a
										href="/admin/servers/{server.id}"
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
							<td colspan="7" class="text-center text-sm text-surface-600 dark:text-surface-400">
								Total Servers: {data.servers.length}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		{/if}
	</div>
</div>
