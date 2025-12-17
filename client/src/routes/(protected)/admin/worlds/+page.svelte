<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { Globe, Plus, Search, ExternalLink, Server, Pencil, Trash2 } from 'lucide-svelte';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let searchTerm = $state('');

	let filteredWorlds = $derived(
		data.worlds.filter((world) => {
			if (!searchTerm) return true;
			const search = searchTerm.toLowerCase();
			return (
				world.id.toLowerCase().includes(search) ||
				world.name.toLowerCase().includes(search) ||
				(world.server?.name && world.server.name.toLowerCase().includes(search))
			);
		})
	);

	// State for delete confirmation modal
	let deleteModalOpen = $state(false);
	let worldToDelete = $state<(typeof data.worlds)[0] | null>(null);
	let isDeleting = $state(false);

	function openDeleteModal(world: (typeof data.worlds)[0]) {
		worldToDelete = world;
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		if (!isDeleting) {
			deleteModalOpen = false;
			worldToDelete = null;
		}
	}
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
					{searchTerm
						? 'Try a different search term'
						: 'Create your first world to get started'}
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
										<span>{world.server?.name || 'No Server'}</span>
									</div>
								</td>
								<td>{world.regions?.length || 0}</td>
								<td class="font-mono text-xs">{world.id}</td>
								<td class="text-right space-x-2">
									<a
										href="/admin/worlds/{world.id}"
										class="btn btn-sm preset-tonal-primary-500 rounded-md"
									>
										<ExternalLink size={16} />
										<span>View</span>
									</a>
									<a
										href="/admin/worlds/{world.id}?edit=true"
										class="btn btn-sm preset-tonal-secondary-500 rounded-md"
									>
										<Pencil size={16} />
										<span>Edit</span>
									</a>
									<button
										type="button"
										class="btn btn-sm preset-filled-error-500 rounded-md"
										onclick={() => openDeleteModal(world)}
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
							<td
								colspan="5"
								class="text-center text-sm text-surface-600 dark:text-surface-400"
							>
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

<!-- Delete Confirmation Modal -->
{#if deleteModalOpen && worldToDelete}
	{@const regionCount = worldToDelete.regions?.length || 0}
	{@const tileCount = regionCount * 100}
	{@const plotCount = tileCount * 5}

	<div
		class="modal-backdrop"
		onclick={closeDeleteModal}
		onkeydown={(e) => e.key === 'Escape' && closeDeleteModal()}
		role="presentation"
		tabindex="-1"
	>
		<div
			class="modal preset-filled-surface-50-950 w-full max-w-md"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<header class="modal-header">
				<h3 class="h3">Delete World</h3>
			</header>
			<section class="modal-body space-y-4">
				<p>
					Are you sure you want to delete the world <strong>{worldToDelete.name}</strong>?
				</p>

				<aside class="alert preset-filled-warning-500 rounded-md">
					<div class="alert-message">
						<p class="font-semibold">⚠️ Cascade Delete Warning</p>
						<p class="text-sm">This will permanently delete:</p>
						<ul class="text-sm list-disc list-inside mt-2 space-y-1">
							<li>{regionCount} region{regionCount === 1 ? '' : 's'}</li>
							<li>~{tileCount.toLocaleString()} tiles</li>
							<li>~{plotCount.toLocaleString()} plots</li>
							<li>All associated settlements and resources</li>
						</ul>
					</div>
				</aside>

				<aside class="alert preset-filled-error-500 rounded-md">
					<div class="alert-message">
						<p class="font-semibold">This action cannot be undone!</p>
					</div>
				</aside>
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
					<input type="hidden" name="worldId" value={worldToDelete.id} />
					<button
						type="submit"
						class="btn preset-filled-error-500 rounded-md"
						disabled={isDeleting}
					>
						{#if isDeleting}
							<span>Deleting...</span>
						{:else}
							<Trash2 size={16} />
							<span>Delete World</span>
						{/if}
					</button>
				</form>
			</footer>
		</div>
	</div>
{/if}
