<script lang="ts">
	import type { PageData } from './$types';
	import {
		Server,
		Globe,
		Users,
		Home,
		UserCheck,
		Activity,
		Settings,
		TrendingUp
	} from 'lucide-svelte';
	import StatsCard from '$lib/components/admin/StatsCard.svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
	<!-- Welcome Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<h1 class="text-3xl font-bold mb-2">Admin Dashboard</h1>
		<p class="text-surface-600 dark:text-surface-400">
			Welcome back, <span class="font-semibold">{data.account?.email}</span>
		</p>
	</div>

	<!-- Primary Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<StatsCard
			label="Total Players"
			value={data.stats.totalPlayers}
			icon={Users}
			href="/admin/players"
		/>

		<StatsCard
			label="Active Settlements"
			value={data.stats.totalSettlements}
			icon={Home}
			iconColor="success"
			href="/admin/settlements"
		/>

		<StatsCard
			label="Game Worlds"
			value={data.stats.totalWorlds}
			icon={Globe}
			iconColor="primary"
			href="/admin/worlds"
		/>

		<StatsCard
			label="Game Servers"
			value={data.stats.totalServers}
			icon={Server}
			iconColor="warning"
			href="/admin/servers"
		/>
	</div>

	<!-- Activity Stats -->
	<div class="card preset-filled-surface-100-900 p-6">
		<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
			<Activity size={24} />
			Recent Activity
		</h2>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<div class="text-center p-4 bg-surface-200 dark:bg-surface-800 rounded-lg">
				<div class="text-3xl font-bold text-primary-500">{data.stats.recentPlayers}</div>
				<div class="text-sm text-surface-600 dark:text-surface-400 mt-1">
					New Players (7 days)
				</div>
			</div>
			<div class="text-center p-4 bg-surface-200 dark:bg-surface-800 rounded-lg">
				<div class="text-3xl font-bold text-success-500">
					{data.stats.recentSettlements}
				</div>
				<div class="text-sm text-surface-600 dark:text-surface-400 mt-1">
					New Settlements (7 days)
				</div>
			</div>
			<div class="text-center p-4 bg-surface-200 dark:bg-surface-800 rounded-lg">
				<div class="text-3xl font-bold text-warning-500">{data.stats.activePlayers}</div>
				<div class="text-sm text-surface-600 dark:text-surface-400 mt-1">
					Active Players (24h)
				</div>
			</div>
		</div>
	</div>

	<!-- System Overview -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
		<!-- Player Distribution -->
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-lg font-bold mb-4 flex items-center gap-2">
				<UserCheck size={20} />
				Player Distribution
			</h2>
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-surface-600 dark:text-surface-400">Members</span>
					<div class="flex items-center gap-2">
						<span class="font-semibold">{data.stats.memberCount}</span>
						<span class="text-xs text-surface-500">
							({(
								(data.stats.memberCount / Math.max(data.stats.totalPlayers, 1)) *
								100
							).toFixed(0)}%)
						</span>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-surface-600 dark:text-surface-400">Support Staff</span
					>
					<div class="flex items-center gap-2">
						<span class="font-semibold">{data.stats.supportCount}</span>
						<span class="text-xs text-surface-500">
							({(
								(data.stats.supportCount / Math.max(data.stats.totalPlayers, 1)) *
								100
							).toFixed(0)}%)
						</span>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-surface-600 dark:text-surface-400"
						>Administrators</span
					>
					<div class="flex items-center gap-2">
						<span class="font-semibold">{data.stats.adminCount}</span>
						<span class="text-xs text-surface-500">
							({(
								(data.stats.adminCount / Math.max(data.stats.totalPlayers, 1)) *
								100
							).toFixed(0)}%)
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Growth Metrics -->
		<div class="card preset-filled-surface-100-900 p-6">
			<h2 class="text-lg font-bold mb-4 flex items-center gap-2">
				<TrendingUp size={20} />
				Growth Metrics
			</h2>
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-surface-600 dark:text-surface-400"
						>Avg Settlements/Player</span
					>
					<span class="font-semibold">{data.stats.avgSettlementsPerPlayer}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-surface-600 dark:text-surface-400"
						>Players with Profiles</span
					>
					<span class="font-semibold">{data.stats.playersWithProfiles}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-surface-600 dark:text-surface-400"
						>Total Worlds Created</span
					>
					<span class="font-semibold">{data.stats.totalWorlds}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="card preset-filled-surface-100-900 p-6">
		<h2 class="text-xl font-bold mb-4">Quick Actions</h2>
		<div class="flex flex-wrap gap-3">
			<a href="/admin/servers/create" class="btn preset-filled-primary-500 rounded-md">
				<Server size={20} />
				<span>Create Server</span>
			</a>
			<a href="/admin/worlds/create" class="btn preset-filled-primary-500 rounded-md">
				<Globe size={20} />
				<span>Create World</span>
			</a>
			<a href="/admin/players" class="btn preset-filled-secondary-500 rounded-md">
				<Users size={20} />
				<span>Manage Players</span>
			</a>
			<a href="/admin/settings" class="btn preset-filled-tertiary-500 rounded-md">
				<Settings size={20} />
				<span>Settings</span>
			</a>
		</div>
	</div>
</div>
