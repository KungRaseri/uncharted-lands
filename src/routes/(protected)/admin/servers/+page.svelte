<script lang="ts">
	import type { PageData } from './$types';
	import { Server, Plus, ExternalLink } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold flex items-center gap-2">
				<Server size={28} />
				Servers
			</h1>
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
				Manage game servers and their configurations
			</p>
		</div>
		<a href="/admin/servers/create" class="btn preset-filled-primary-500 rounded-md">
			<Plus size={20} />
			<span>Create Server</span>
		</a>
	</div>

	<!-- Servers List -->
	<div class="card preset-filled-surface-100-900">
		{#if data.servers.length === 0}
			<div class="p-12 text-center">
				<Server size={48} class="mx-auto mb-4 text-surface-400" />
				<h3 class="text-xl font-semibold mb-2">No servers yet</h3>
				<p class="text-surface-600 dark:text-surface-400 mb-4">
					Create your first server to get started
				</p>
				<a href="/admin/servers/create" class="btn preset-filled-primary-500 rounded-md">
					<Plus size={20} />
					<span>Create Server</span>
				</a>
			</div>
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
