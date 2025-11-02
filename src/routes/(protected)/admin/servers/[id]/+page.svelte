<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import type { PageData } from './$types';
	import { Server, Globe, Users, Calendar, ArrowLeft, Plus } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Dashboard</a>
		<span class="text-surface-400">/</span>
		<a href="/admin/servers" class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Servers</a>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">{data.server.name}</span>
	</div>

	<!-- Server Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-start justify-between mb-4">
			<div class="flex items-center gap-4">
				<div class="p-3 bg-primary-500/10 rounded-lg">
					<Server size={32} class="text-primary-500" />
				</div>
				<div>
					<h1 class="text-3xl font-bold">{data.server.name}</h1>
					<p class="text-sm text-surface-600 dark:text-surface-400 font-mono">{data.server.id}</p>
				</div>
			</div>
			<span
				class="badge {data.server.status === 'ONLINE'
					? 'preset-filled-success-500'
					: 'preset-filled-error-500'}"
			>
				{data.server.status}
			</span>
		</div>

		<!-- Server Info Grid -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
			<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
				<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Host</p>
				<p class="font-semibold">{data.server.host || 'Not configured'}</p>
			</div>
			<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
				<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Port</p>
				<p class="font-semibold">{data.server.port || 'Not configured'}</p>
			</div>
			<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
				<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Created</p>
				<p class="font-semibold">{new Date(data.server.createdAt).toLocaleDateString()}</p>
			</div>
		</div>
	</div>

	<!-- Worlds Section -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-xl font-bold flex items-center gap-2">
				<Globe size={24} />
				Worlds ({data.server.worlds.length})
			</h2>
			<a href="/admin/worlds/create" class="btn btn-sm preset-filled-primary-500 rounded-md">
				<Plus size={16} />
				<span>Add World</span>
			</a>
		</div>

		{#if data.server.worlds.length === 0}
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
						<p class="text-xs text-surface-600 dark:text-surface-400 font-mono mb-3">{world.id}</p>
						<div class="space-y-1 text-sm">
							<div class="flex items-center gap-2 text-surface-600 dark:text-surface-400">
								<Calendar size={14} />
								<span>Created: {new Date(world.createdAt).toLocaleDateString()}</span>
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
			Players ({data.server.players.length})
		</h2>

		{#if data.server.players.length === 0}
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
							<Avatar src={player.profile.picture} size="md" />
							<div class="flex-1 min-w-0">
								<p class="font-semibold truncate">{player.profile.username}</p>
								<p class="text-xs text-surface-600 dark:text-surface-400 font-mono truncate">
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
