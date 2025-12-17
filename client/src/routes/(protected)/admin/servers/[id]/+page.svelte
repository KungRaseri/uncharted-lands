<script lang="ts">
	import type { PageData } from './$types';
	import {
		Server,
		Globe,
		Users,
		Calendar,
		ArrowLeft,
		Plus,
		Edit,
		Trash2,
		Save,
		X
	} from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let { data, form }: { data: PageData; form: any } = $props();

	let isEditing = $state(false);
	let showDeleteConfirm = $state(false);
	let isDeleting = $state(false);

	// Edit form state
	let editName = $state(data.server.name);
	let editHostname = $state(data.server.hostname);
	let editPort = $state(data.server.port.toString());
	let editStatus = $state(data.server.status);

	// Auto-enable edit mode if ?edit=true in URL
	onMount(() => {
		if (page.url.searchParams.get('edit') === 'true') {
			startEdit();
		}
	});

	function startEdit() {
		editName = data.server.name;
		editHostname = data.server.hostname;
		editPort = data.server.port.toString();
		editStatus = data.server.status;
		isEditing = true;
	}

	function cancelEdit() {
		isEditing = false;
	}
</script>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>Dashboard</a
		>
		<span class="text-surface-400">/</span>
		<a
			href="/admin/servers"
			class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Servers</a
		>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">{data.server.name}</span>
	</div>

	<!-- Server Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		{#if !isEditing}
			<!-- View Mode -->
			<div class="flex items-start justify-between mb-4">
				<div class="flex items-center gap-4">
					<div class="p-3 bg-primary-500/10 rounded-lg">
						<Server size={32} class="text-primary-500" />
					</div>
					<div>
						<h1 class="text-3xl font-bold">{data.server.name}</h1>
						<p class="text-sm text-surface-600 dark:text-surface-400 font-mono">
							{data.server.id}
						</p>
					</div>
				</div>
				<div class="flex items-center gap-2">
					<span
						class="badge {data.server.status === 'ONLINE'
							? 'preset-filled-success-500'
							: 'preset-filled-error-500'}"
					>
						{data.server.status}
					</span>
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

			<!-- Server Info Grid -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
				<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Hostname</p>
					<p class="font-semibold">{data.server.hostname}</p>
				</div>
				<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Port</p>
					<p class="font-semibold">{data.server.port}</p>
				</div>
				<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Created</p>
					<p class="font-semibold">
						{new Date(data.server.createdAt).toLocaleDateString()}
					</p>
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
				<div class="flex items-start justify-between mb-6">
					<div class="flex items-center gap-4">
						<div class="p-3 bg-primary-500/10 rounded-lg">
							<Server size={32} class="text-primary-500" />
						</div>
						<div>
							<h1 class="text-2xl font-bold mb-2">Edit Server</h1>
							<p class="text-sm text-surface-600 dark:text-surface-400 font-mono">
								{data.server.id}
							</p>
						</div>
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

				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<label class="label">
						<span class="label-text">Server Name *</span>
						<input
							type="text"
							name="name"
							bind:value={editName}
							class="input preset-filled-surface-200-700"
							required
						/>
					</label>

					<label class="label">
						<span class="label-text">Status</span>
						<select
							name="status"
							bind:value={editStatus}
							class="select preset-filled-surface-200-700"
						>
							<option value="ONLINE">Online</option>
							<option value="OFFLINE">Offline</option>
							<option value="MAINTENANCE">Maintenance</option>
						</select>
					</label>

					<label class="label">
						<span class="label-text">Hostname</span>
						<input
							type="text"
							name="hostname"
							bind:value={editHostname}
							class="input preset-filled-surface-200-700"
							placeholder="localhost"
						/>
					</label>

					<label class="label">
						<span class="label-text">Port</span>
						<input
							type="number"
							name="port"
							bind:value={editPort}
							class="input preset-filled-surface-200-700"
							placeholder="5000"
						/>
					</label>
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
					Delete Server?
				</h3>
				<p class="mb-4 text-surface-600 dark:text-surface-400">
					Are you sure you want to delete <strong>{data.server.name}</strong>?
				</p>
				{#if data.server.worlds.length > 0}
					<div
						class="mb-4 p-3 bg-error-500/10 border border-error-500 rounded-lg text-error-500"
					>
						<p class="font-semibold">Cannot delete this server!</p>
						<p class="text-sm mt-1">
							This server has {data.server.worlds.length} world(s). Delete all worlds first.
						</p>
					</div>
				{:else}
					<p class="mb-6 text-sm text-error-500">
						This action cannot be undone. All associated data will be permanently
						deleted.
					</p>
				{/if}

				<div class="flex gap-3 justify-end">
					<button
						onclick={() => (showDeleteConfirm = false)}
						class="btn preset-tonal-surface-500 rounded-md"
						disabled={isDeleting}
					>
						Cancel
					</button>
					{#if data.server.worlds.length === 0}
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
									<span>Delete Server</span>
								{/if}
							</button>
						</form>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Worlds Section -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-bold flex items-center gap-2">
				<Globe size={24} />
				Worlds ({data.server.worlds?.length || 0})
			</h2>
			<a href="/admin/worlds/create" class="btn btn-sm preset-filled-primary-500 rounded-md">
				<Plus size={16} />
				<span>Add World</span>
			</a>
		</div>

		{#if !data.server.worlds || data.server.worlds.length === 0}
			<div class="text-center py-8">
				<Globe size={48} class="mx-auto mb-4 text-surface-400" />
				<p class="text-surface-600 dark:text-surface-400">No worlds created yet</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each data.server.worlds as world}
					<a
						href="/admin/worlds/{world.id}"
						class="card preset-filled-surface-200-700 p-4 hover:preset-tonal-primary-500 transition-colors"
					>
						<h3 class="font-bold text-lg mb-2">{world.name}</h3>
						<p class="text-xs text-surface-600 dark:text-surface-400 font-mono mb-3">
							{world.id}
						</p>
						<div class="space-y-1 text-sm">
							<div
								class="flex items-center gap-2 text-surface-600 dark:text-surface-400"
							>
								<Calendar size={14} />
								<span
									>Created: {new Date(world.createdAt).toLocaleDateString()}</span
								>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Players Section -->
	<div class="card preset-filled-surface-100-900 p-6">
		<h2 class="text-xl font-bold flex items-center gap-2 mb-4">
			<Users size={24} />
			Players ({data.server.players?.length || 0})
		</h2>

		{#if !data.server.players || data.server.players.length === 0}
			<div class="text-center py-8">
				<Users size={48} class="mx-auto mb-4 text-surface-400" />
				<p class="text-surface-600 dark:text-surface-400">No players on this server yet</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{#each data.server.players as player}
					<a
						href="/admin/players/{player.profile.accountId}"
						class="card preset-filled-surface-200-700 p-4 hover:preset-tonal-primary-500 transition-colors"
					>
						<div class="flex items-center gap-3">
							<div
								class="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center overflow-hidden"
							>
								{#if player.profile.picture}
									<img
										src={player.profile.picture}
										alt={player.profile.username}
										class="w-full h-full object-cover"
									/>
								{:else}
									<Users size={24} class="text-primary-500" />
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-semibold truncate">{player.profile.username}</p>
								<p
									class="text-xs text-surface-600 dark:text-surface-400 font-mono truncate"
								>
									{player.profileId}
								</p>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Back Button -->
	<div>
		<a href="/admin/servers" class="btn preset-tonal-surface-500 rounded-md">
			<ArrowLeft size={20} />
			<span>Back to Servers</span>
		</a>
	</div>
</div>
