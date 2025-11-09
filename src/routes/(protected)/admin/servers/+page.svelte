<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { Server, Plus, ExternalLink, Pencil, Trash2 } from 'lucide-svelte';
	import PageHeader from '$lib/components/admin/PageHeader.svelte';
	import EmptyState from '$lib/components/admin/EmptyState.svelte';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// State for delete confirmation modal
	let deleteModalOpen = $state(false);
	let serverToDelete = $state<typeof data.servers[0] | null>(null);
	let isDeleting = $state(false);

	function openDeleteModal(server: typeof data.servers[0]) {
		serverToDelete = server;
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		if (!isDeleting) {
			deleteModalOpen = false;
			serverToDelete = null;
		}
	}
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

	<!-- Success/Error Messages -->
	{#if form?.success}
		<aside class="alert preset-filled-success-500 rounded-md">
			<div class="alert-message">
				<p>{form.message}</p>
			</div>
		</aside>
	{:else if form?.success === false}
		<aside class="alert preset-filled-error-500 rounded-md">
			<div class="alert-message">
				<p>{form.message}</p>
			</div>
		</aside>
	{/if}

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
								<td>{server.hostname || 'N/A'}</td>
								<td>{server.port || 'N/A'}</td>
								<td>
									<span class="badge {server.status === 'ONLINE' ? 'preset-filled-success-500' : server.status === 'MAINTENANCE' ? 'preset-filled-warning-500' : 'preset-filled-error-500'}">
										{server.status}
									</span>
								</td>
								<td>{server.worlds?.length || 0}</td>
								<td class="text-right space-x-2">
									<a
										href="/admin/servers/{server.id}"
										class="btn btn-sm preset-tonal-primary-500 rounded-md"
									>
										<ExternalLink size={16} />
										<span>View</span>
									</a>
									<a
										href="/admin/servers/{server.id}?edit=true"
										class="btn btn-sm preset-tonal-secondary-500 rounded-md"
									>
										<Pencil size={16} />
										<span>Edit</span>
									</a>
									<button
										type="button"
										class="btn btn-sm preset-filled-error-500 rounded-md"
										onclick={() => openDeleteModal(server)}
									>
										<Trash2 size={16} />
										<span>Delete</span>
									</button>
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

<!-- Delete Confirmation Modal -->
{#if deleteModalOpen && serverToDelete}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={closeDeleteModal} role="presentation">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal preset-filled-surface-50-950 w-full max-w-md" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="delete-modal-title" tabindex="-1">
			<header class="modal-header">
				<h3 class="h3" id="delete-modal-title">Delete Server</h3>
			</header>
			<section class="modal-body space-y-4">
				<p>Are you sure you want to delete the server <strong>{serverToDelete.name}</strong>?</p>
				
				{#if serverToDelete.worlds && serverToDelete.worlds.length > 0}
					<aside class="alert preset-filled-warning-500 rounded-md">
						<div class="alert-message">
							<p class="font-semibold">Warning: This server has {serverToDelete.worlds.length} world(s)</p>
							<p class="text-sm">You must delete or reassign all worlds before deleting this server.</p>
						</div>
					</aside>
				{:else}
					<aside class="alert preset-filled-error-500 rounded-md">
						<div class="alert-message">
							<p class="font-semibold">This action cannot be undone!</p>
						</div>
					</aside>
				{/if}
			</section>
			<footer class="modal-footer">
				<button 
					type="button" 
					class="btn preset-tonal-surface-500 rounded-md" 
					onclick={closeDeleteModal}
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
							closeDeleteModal();
						};
					}}
				>
					<input type="hidden" name="serverId" value={serverToDelete.id} />
					<button 
						type="submit" 
						class="btn preset-filled-error-500 rounded-md"
						disabled={isDeleting || (serverToDelete.worlds && serverToDelete.worlds.length > 0)}
					>
						{#if isDeleting}
							<span>Deleting...</span>
						{:else}
							<Trash2 size={16} />
							<span>Delete Server</span>
						{/if}
					</button>
				</form>
			</footer>
		</div>
	</div>
{/if}
