<script lang="ts">
	import type { PageData } from './$types';
	import { Shield, AlertTriangle, Users, Info } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Wardens | Uncharted Lands</title>
</svelte:head>

<div class="max-w-7xl mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<h1
				class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-3"
			>
				<Shield size={32} class="text-primary-500" />
				Wardens
			</h1>
			<p class="text-surface-600 dark:text-surface-400">
				Manage your settlement defenses and military forces
			</p>
		</div>
	</div>

	<!-- Coming Soon Notice -->
	<div class="card preset-filled-warning-500 p-6">
		<div class="flex items-start gap-4">
			<Info size={24} class="shrink-0" />
			<div>
				<h3 class="text-lg font-bold mb-2">Coming Soon</h3>
				<p class="mb-3">
					The Wardens system is currently under development. This feature will allow you to:
				</p>
				<ul class="list-disc list-inside space-y-1">
					<li>Recruit and manage defensive units</li>
					<li>Set up patrols and guard posts</li>
					<li>Monitor threat levels and security status</li>
					<li>Train military units and upgrade defenses</li>
					<li>Coordinate defensive strategies across settlements</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Placeholder Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<!-- Defense Status -->
		<div class="card preset-filled-surface-100-900 p-6 opacity-50">
			<div class="flex items-center gap-3 mb-4">
				<div class="p-3 bg-success-500/10 rounded-lg">
					<Shield size={24} class="text-success-500" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-surface-900 dark:text-surface-100">Defense Status</h3>
					<p class="text-sm text-surface-600 dark:text-surface-400">Overall security level</p>
				</div>
			</div>
			<div class="text-center py-4">
				<p class="text-4xl font-bold text-surface-400">--</p>
				<p class="text-sm text-surface-500 mt-2">Not yet available</p>
			</div>
		</div>

		<!-- Active Units -->
		<div class="card preset-filled-surface-100-900 p-6 opacity-50">
			<div class="flex items-center gap-3 mb-4">
				<div class="p-3 bg-primary-500/10 rounded-lg">
					<Users size={24} class="text-primary-500" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-surface-900 dark:text-surface-100">Active Units</h3>
					<p class="text-sm text-surface-600 dark:text-surface-400">Wardens on duty</p>
				</div>
			</div>
			<div class="text-center py-4">
				<p class="text-4xl font-bold text-surface-400">--</p>
				<p class="text-sm text-surface-500 mt-2">Not yet available</p>
			</div>
		</div>

		<!-- Threat Level -->
		<div class="card preset-filled-surface-100-900 p-6 opacity-50">
			<div class="flex items-center gap-3 mb-4">
				<div class="p-3 bg-warning-500/10 rounded-lg">
					<AlertTriangle size={24} class="text-warning-500" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-surface-900 dark:text-surface-100">Threat Level</h3>
					<p class="text-sm text-surface-600 dark:text-surface-400">Current danger assessment</p>
				</div>
			</div>
			<div class="text-center py-4">
				<p class="text-4xl font-bold text-surface-400">--</p>
				<p class="text-sm text-surface-500 mt-2">Not yet available</p>
			</div>
		</div>
	</div>

	<!-- Back to Game -->
	<div class="flex justify-center">
		<a href="/game" class="btn preset-tonal-surface-500 rounded-md"> ← Back to Game Overview </a>
	</div>
</div>
