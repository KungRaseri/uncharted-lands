<script lang="ts">
	import type { PageData } from './$types';
	import { Clock, Calendar, MapPin, Building2, Users, Info, Filter, Search } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let searchTerm = $state('');
	let filterType = $state('all');

	const activityTypes = ['all', 'settlements', 'resources', 'structures', 'social'];
</script>

<svelte:head>
	<title>History | Uncharted Lands</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<h1
				class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-3"
			>
				<Clock size={32} class="text-primary-500" />
				Activity History
			</h1>
			<p class="text-surface-600 dark:text-surface-400">Your recent activities and events</p>
		</div>
	</div>

	<!-- Filters -->
	<div class="card preset-filled-surface-100-900 p-4">
		<div class="flex flex-col md:flex-row gap-4">
			<!-- Search -->
			<div class="flex-1">
				<label class="label">
					<span class="text-sm font-medium mb-2">Search</span>
					<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
						<div class="input-group-shim">
							<Search size={16} />
						</div>
						<input
							type="text"
							bind:value={searchTerm}
							placeholder="Search activity..."
							class="input"
						/>
					</div>
				</label>
			</div>

			<!-- Filter by type -->
			<div class="w-full md:w-48">
				<label class="label">
					<span class="text-sm font-medium mb-2">Filter</span>
					<select bind:value={filterType} class="select">
						{#each activityTypes as type}
							<option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
						{/each}
					</select>
				</label>
			</div>
		</div>
	</div>

	<!-- Coming Soon Notice -->
	<div class="card preset-filled-warning-500 p-6">
		<div class="flex items-start gap-4">
			<Info size={24} class="shrink-0" />
			<div>
				<h3 class="text-lg font-bold mb-2">Coming Soon</h3>
				<p class="mb-3">
					The Activity History system is currently under development. This feature will track:
				</p>
				<ul class="list-disc list-inside space-y-1">
					<li>Settlement founding and development events</li>
					<li>Resource gathering and trading activities</li>
					<li>Structure construction and upgrades</li>
					<li>Social interactions and guild activities</li>
					<li>Combat and defense events</li>
					<li>Achievements and milestones</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Placeholder Timeline -->
	<div class="card preset-filled-surface-100-900 p-6 opacity-50">
		<h2 class="text-xl font-bold mb-4 text-surface-900 dark:text-surface-100">Recent Activity</h2>
		<div class="space-y-4">
			{#each [1, 2, 3] as item}
				<div class="flex gap-4 items-start p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<div
						class="w-10 h-10 rounded-full bg-surface-300 dark:bg-surface-600 flex items-center justify-center shrink-0"
					>
						<Clock size={20} class="text-surface-500" />
					</div>
					<div class="flex-1">
						<div class="h-4 bg-surface-300 dark:bg-surface-600 rounded w-3/4 mb-2"></div>
						<div class="h-3 bg-surface-300 dark:bg-surface-600 rounded w-1/2"></div>
					</div>
				</div>
			{/each}
		</div>
		<p class="text-center text-surface-500 mt-4">Activity tracking not yet available</p>
	</div>

	<!-- Back to Game -->
	<div class="flex justify-center">
		<a href="/game" class="btn preset-tonal-surface-500 rounded-md"> ← Back to Game Overview </a>
	</div>
</div>
