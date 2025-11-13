<script lang="ts">
	import type { PageData } from './$types';
	import { Server, Globe, Users, MapPin, Grid3x3, LayoutGrid, Settings } from 'lucide-svelte';
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

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		<StatsCard
			label="Total Servers"
			value={data.stats.totalServers}
			icon={Server}
			href="/admin/servers"
		/>

		<StatsCard
			label="Total Worlds"
			value={data.stats.totalWorlds}
			icon={Globe}
			href="/admin/worlds"
		/>

		<StatsCard
			label="Total Players"
			value={data.stats.totalPlayers}
			icon={Users}
			href="/admin/players"
		/>

		<StatsCard
			label="Total Regions"
			value={data.stats.totalRegions}
			icon={MapPin}
			iconColor="secondary"
			href="/admin/regions"
		/>

		<StatsCard
			label="Total Tiles"
			value={data.stats.totalTiles}
			icon={Grid3x3}
			iconColor="secondary"
			href="/admin/tiles"
		/>

		<StatsCard
			label="Total Plots"
			value={data.stats.totalPlots}
			icon={LayoutGrid}
			iconColor="secondary"
			href="/admin/plots"
		/>
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
