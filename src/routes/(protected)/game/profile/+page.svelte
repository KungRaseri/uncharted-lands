<script lang="ts">
	import type { PageData } from './$types';
	import { User, MapPin, Calendar, Award, TrendingUp, Info, Mail, Shield } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	
	const joinDate = $derived(data.account?.createdAt ? new Date(data.account.createdAt) : null);
</script>

<svelte:head>
	<title>Profile | Uncharted Lands</title>
</svelte:head>

<div class="max-w-4xl mx-auto p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-3">
				<User size={32} class="text-primary-500" />
				Player Profile
			</h1>
			<p class="text-surface-600 dark:text-surface-400">
				Your player information and statistics
			</p>
		</div>
	</div>

	<!-- Profile Card -->
	<div class="card preset-filled-surface-100-900 p-6">
		<div class="flex items-start gap-6">
			<!-- Avatar Placeholder -->
			<div class="w-24 h-24 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
				<User size={48} class="text-primary-500" />
			</div>
			
			<div class="flex-1">
				<h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-2">
					{data.profile?.username || 'Unnamed Player'}
				</h2>
				<p class="text-sm text-surface-600 dark:text-surface-400 font-mono mb-4">
					ID: {data.profile?.id?.slice(0, 12)}...
				</p>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="flex items-center gap-2 text-sm">
						<Calendar size={16} class="text-surface-400" />
						<span class="text-surface-600 dark:text-surface-400">
							Joined: {joinDate ? joinDate.toLocaleDateString() : 'Unknown'}
						</span>
					</div>
					<div class="flex items-center gap-2 text-sm">
						<Shield size={16} class="text-surface-400" />
						<span class="text-surface-600 dark:text-surface-400">
							Role: {data.account?.role || 'Player'}
						</span>
					</div>
					<div class="flex items-center gap-2 text-sm">
						<Mail size={16} class="text-surface-400" />
						<span class="text-surface-600 dark:text-surface-400">
							{data.account?.email || 'No email'}
						</span>
					</div>
					<div class="flex items-center gap-2 text-sm">
						<MapPin size={16} class="text-surface-400" />
						<span class="text-surface-600 dark:text-surface-400">
							Settlements: {data.settlementCount || 0}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Statistics Grid -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<!-- Settlements -->
		<div class="card preset-filled-surface-100-900 p-6">
			<div class="flex items-center gap-3 mb-3">
				<div class="p-3 bg-primary-500/10 rounded-lg">
					<MapPin size={24} class="text-primary-500" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-surface-900 dark:text-surface-100">Settlements</h3>
					<p class="text-sm text-surface-600 dark:text-surface-400">Founded</p>
				</div>
			</div>
			<p class="text-3xl font-bold text-surface-900 dark:text-surface-100">
				{data.settlementCount || 0}
			</p>
		</div>

		<!-- Achievements -->
		<div class="card preset-filled-surface-100-900 p-6 opacity-50">
			<div class="flex items-center gap-3 mb-3">
				<div class="p-3 bg-warning-500/10 rounded-lg">
					<Award size={24} class="text-warning-500" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-surface-900 dark:text-surface-100">Achievements</h3>
					<p class="text-sm text-surface-600 dark:text-surface-400">Unlocked</p>
				</div>
			</div>
			<p class="text-3xl font-bold text-surface-400">--</p>
			<p class="text-xs text-surface-500 mt-2">Coming soon</p>
		</div>

		<!-- Level -->
		<div class="card preset-filled-surface-100-900 p-6 opacity-50">
			<div class="flex items-center gap-3 mb-3">
				<div class="p-3 bg-success-500/10 rounded-lg">
					<TrendingUp size={24} class="text-success-500" />
				</div>
				<div>
					<h3 class="text-lg font-bold text-surface-900 dark:text-surface-100">Level</h3>
					<p class="text-sm text-surface-600 dark:text-surface-400">Experience</p>
				</div>
			</div>
			<p class="text-3xl font-bold text-surface-400">--</p>
			<p class="text-xs text-surface-500 mt-2">Coming soon</p>
		</div>
	</div>

	<!-- Coming Soon Features -->
	<div class="card preset-filled-warning-500 p-6">
		<div class="flex items-start gap-4">
			<Info size={24} class="shrink-0" />
			<div>
				<h3 class="text-lg font-bold mb-2">Additional Features Coming Soon</h3>
				<ul class="list-disc list-inside space-y-1">
					<li>Detailed player statistics and analytics</li>
					<li>Achievement system and badges</li>
					<li>Experience and leveling system</li>
					<li>Player reputation and rankings</li>
					<li>Customizable profile settings</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Back to Game -->
	<div class="flex justify-center">
		<a href="/game" class="btn preset-tonal-surface-500 rounded-md">
			← Back to Game Overview
		</a>
	</div>
</div>
