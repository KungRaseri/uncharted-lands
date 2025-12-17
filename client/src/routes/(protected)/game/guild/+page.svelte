<script lang="ts">
	import type { PageData } from './$types';
	import {
		Users,
		Crown,
		Shield,
		TrendingUp,
		Calendar,
		MapPin,
		Info,
		UserPlus,
		Settings
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Guild | Uncharted Lands</title>
</svelte:head>

<div class="max-w-6xl mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<h1
				class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-3"
			>
				<Users size={32} class="text-primary-500" />
				Guild
			</h1>
			<p class="text-surface-600 dark:text-surface-400">Your guild information and members</p>
		</div>
		<button class="btn preset-filled-primary-500 rounded-md" disabled>
			<UserPlus size={20} />
			<span>Invite Member</span>
		</button>
	</div>

	<!-- Coming Soon Notice -->
	<div class="card preset-filled-warning-500 p-6">
		<div class="flex items-start gap-4">
			<Info size={24} class="shrink-0" />
			<div>
				<h3 class="text-lg font-bold mb-2">Coming Soon</h3>
				<p class="mb-3">
					The Guild system is currently under development. This feature will allow you to:
				</p>
				<ul class="list-disc list-inside space-y-1">
					<li>Create and manage guilds with other players</li>
					<li>Recruit members and assign roles</li>
					<li>Share resources and coordinate strategies</li>
					<li>Participate in guild wars and alliances</li>
					<li>Track guild achievements and rankings</li>
					<li>Access guild-exclusive features and bonuses</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Placeholder Guild Info -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
		<!-- Guild Overview -->
		<div class="card preset-filled-surface-100-900 p-6">
			<div class="flex items-center gap-4 mb-6">
				<div class="w-20 h-20 rounded-lg bg-primary-500/20 flex items-center justify-center">
					<Users size={40} class="text-primary-500" />
				</div>
				<div class="flex-1">
					<div class="h-6 bg-surface-300 dark:bg-surface-600 rounded w-3/4 mb-2"></div>
					<div class="h-4 bg-surface-300 dark:bg-surface-600 rounded w-1/2"></div>
				</div>
			</div>

			<div class="space-y-3">
				<div class="flex items-center gap-2 text-sm">
					<Crown size={16} class="text-warning-500" />
					<span class="text-surface-600 dark:text-surface-400">Leader:</span>
					<div class="h-4 bg-surface-300 dark:bg-surface-600 rounded w-32"></div>
				</div>
				<div class="flex items-center gap-2 text-sm">
					<Users size={16} class="text-primary-500" />
					<span class="text-surface-600 dark:text-surface-400">Members:</span>
					<div class="h-4 bg-surface-300 dark:bg-surface-600 rounded w-20"></div>
				</div>
				<div class="flex items-center gap-2 text-sm">
					<Calendar size={16} class="text-surface-400" />
					<span class="text-surface-600 dark:text-surface-400">Founded:</span>
					<div class="h-4 bg-surface-300 dark:bg-surface-600 rounded w-24"></div>
				</div>
				<div class="flex items-center gap-2 text-sm">
					<TrendingUp size={16} class="text-success-500" />
					<span class="text-surface-600 dark:text-surface-400">Rank:</span>
					<div class="h-4 bg-surface-300 dark:bg-surface-600 rounded w-16"></div>
				</div>
			</div>

			<p class="text-center text-surface-500 text-sm mt-6">Not in a guild</p>
		</div>

		<!-- Guild Stats -->
		<div class="card preset-filled-surface-100-900 p-6">
			<h3 class="text-lg font-bold mb-4 text-surface-900 dark:text-surface-100">
				Guild Statistics
			</h3>
			<div class="grid grid-cols-2 gap-4">
				<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Settlements</p>
					<p class="text-2xl font-bold text-surface-400">--</p>
				</div>
				<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Resources</p>
					<p class="text-2xl font-bold text-surface-400">--</p>
				</div>
				<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Territory Control</p>
					<p class="text-2xl font-bold text-surface-400">--</p>
				</div>
				<div class="p-4 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Guild Points</p>
					<p class="text-2xl font-bold text-surface-400">--</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Members List -->
	<div class="card preset-filled-surface-100-900 p-6 opacity-50">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-lg font-bold text-surface-900 dark:text-surface-100">Guild Members</h3>
			<button class="btn btn-sm preset-tonal-surface-500 rounded-md" disabled>
				<Settings size={16} />
				<span>Manage</span>
			</button>
		</div>

		<div class="space-y-2">
			{#each [1, 2, 3] as item}
				<div class="flex items-center gap-4 p-3 bg-surface-200 dark:bg-surface-700 rounded-lg">
					<div class="w-10 h-10 rounded-full bg-surface-300 dark:bg-surface-600"></div>
					<div class="flex-1">
						<div class="h-4 bg-surface-300 dark:bg-surface-600 rounded w-1/3 mb-2"></div>
						<div class="h-3 bg-surface-300 dark:bg-surface-600 rounded w-1/4"></div>
					</div>
					<div class="h-6 bg-surface-300 dark:bg-surface-600 rounded w-20"></div>
				</div>
			{/each}
		</div>

		<p class="text-center text-surface-500 text-sm mt-4">No guild members</p>
	</div>

	<!-- Back to Game -->
	<div class="flex justify-center">
		<a href="/game" class="btn preset-tonal-surface-500 rounded-md"> ← Back to Game Overview </a>
	</div>
</div>
