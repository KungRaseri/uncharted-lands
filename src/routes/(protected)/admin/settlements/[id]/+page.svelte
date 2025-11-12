<script lang="ts">
	import type { PageData } from './$types';
	import {
		Building2,
		User,
		Calendar,
		ArrowLeft,
		ExternalLink,
		MapPin,
		Package,
		Grid3x3
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	let settlement = $derived(data.settlement);
</script>

<div class="space-y-6">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm">
		<a href="/admin" class="text-surface-600 dark:text-surface-400 hover:text-primary-500"
			>Dashboard</a
		>
		<span class="text-surface-400">/</span>
		<a
			href="/admin/settlements"
			class="text-surface-600 dark:text-surface-400 hover:text-primary-500">Settlements</a
		>
		<span class="text-surface-400">/</span>
		<span class="font-semibold">{settlement.name}</span>
	</div>

	<!-- Settlement Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-start gap-6">
			<!-- Icon -->
			<div class="flex-none">
				<div
					class="w-24 h-24 rounded-full bg-primary-500/10 flex items-center justify-center ring-4 ring-primary-500/20"
				>
					<Building2 size={48} class="text-primary-500" />
				</div>
			</div>

			<!-- Info -->
			<div class="flex-1">
				<h1 class="text-3xl font-bold mb-2">{settlement.name}</h1>
				<p class="text-sm text-surface-600 dark:text-surface-400 font-mono mb-4">{settlement.id}</p>

				<div class="flex flex-wrap gap-3">
					<span class="badge preset-tonal-secondary-500 text-sm px-3 py-1">
						<Grid3x3 size={14} />
						{settlement.structures?.length || 0} Structures
					</span>
					<span class="badge preset-tonal-tertiary-500 text-sm px-3 py-1">
						<MapPin size={14} />
						{settlement.plot?.length || 0} Plots
					</span>
					<span class="badge preset-tonal-surface-500 text-sm px-3 py-1">
						<Calendar size={14} />
						Created {new Date(settlement.createdAt).toLocaleDateString()}
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Details Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Owner Information -->
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
				<User size={24} />
				Owner Information
			</h2>

			<div class="space-y-4">
				{#if settlement.playerProfile}
					<div>
						<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">
							Player
						</div>
						<p class="font-semibold">{settlement.playerProfile.username}</p>
					</div>
					<div>
						<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">
							Profile ID
						</div>
						<p class="font-mono text-sm">{settlement.playerProfile.id}</p>
					</div>
					<div>
						<a
							href="/admin/players/{settlement.playerProfile.accountId}"
							class="btn preset-tonal-primary-500 rounded-md w-full"
						>
							<ExternalLink size={16} />
							<span>View Player Account</span>
						</a>
					</div>
				{:else}
					<p class="text-surface-600 dark:text-surface-400">No owner information available</p>
				{/if}
			</div>
		</div>

		<!-- Storage/Resources -->
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
				<Package size={24} />
				Resources
			</h2>

			{#if settlement.storage && Object.keys(settlement.storage).length > 0}
				<div class="space-y-2">
					{#each Object.entries(settlement.storage) as [resource, amount]}
						<div
							class="flex items-center justify-between p-2 bg-surface-200 dark:bg-surface-700 rounded"
						>
							<span class="font-medium capitalize">{resource}</span>
							<span class="badge preset-tonal-success-500">{amount}</span>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-surface-600 dark:text-surface-400">No resources stored</p>
			{/if}
		</div>
	</div>

	<!-- Structures Section -->
	{#if settlement.structures && settlement.structures.length > 0}
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
				<Grid3x3 size={24} />
				Structures
			</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
				{#each settlement.structures as structure}
					<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-md">
						<p class="font-semibold mb-1">{structure.type}</p>
						<p class="text-xs text-surface-600 dark:text-surface-400">Level {structure.level}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Plots Section -->
	{#if settlement.plot && settlement.plot.length > 0}
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
				<MapPin size={24} />
				Plots
			</h2>

			<div class="text-sm text-surface-600 dark:text-surface-400">
				<p>
					This settlement has {settlement.plot.length} plot{settlement.plot.length === 1
						? ''
						: 's'}.
				</p>
			</div>
		</div>
	{/if}

	<!-- Metadata -->
	<div class="card preset-filled-surface-100-900 p-6">
		<h2 class="text-xl font-bold mb-4">Metadata</h2>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">Created</div>
				<p class="font-semibold">
					{new Date(settlement.createdAt).toLocaleString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit'
					})}
				</p>
			</div>

			<div>
				<div class="text-sm text-surface-600 dark:text-surface-400 font-medium mb-1">
					Last Updated
				</div>
				<p class="font-semibold">
					{new Date(settlement.updatedAt).toLocaleString('en-US', {
						year: 'numeric',
						month: 'long',
						day: 'numeric',
						hour: '2-digit',
						minute: '2-digit'
					})}
				</p>
			</div>
		</div>
	</div>

	<!-- Back Button -->
	<div>
		<a href="/admin/settlements" class="btn preset-tonal-surface-500 rounded-md">
			<ArrowLeft size={20} />
			<span>Back to Settlements</span>
		</a>
	</div>
</div>
