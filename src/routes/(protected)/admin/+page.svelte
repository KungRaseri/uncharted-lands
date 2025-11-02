<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';
	import { Server, Globe, Users, MapPin, Grid3x3, LayoutGrid } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
	<!-- Welcome Header -->
	<div class="card preset-filled-surface-100-900 p-6">
		<h1 class="text-3xl font-bold mb-2">Admin Dashboard</h1>
		<p class="text-surface-600 dark:text-surface-400">
			Welcome back, <span class="font-semibold">{$page.data.account.email}</span>
		</p>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		<!-- Servers Card -->
		<a href="/admin/servers" class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-primary-500 transition-colors">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Servers</p>
					<p class="text-3xl font-bold">{data.stats.totalServers}</p>
				</div>
				<div class="p-3 bg-primary-500/10 rounded-lg">
					<Server size={24} class="text-primary-500" />
				</div>
			</div>
		</a>

		<!-- Worlds Card -->
		<a href="/admin/worlds" class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-primary-500 transition-colors">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Worlds</p>
					<p class="text-3xl font-bold">{data.stats.totalWorlds}</p>
				</div>
				<div class="p-3 bg-primary-500/10 rounded-lg">
					<Globe size={24} class="text-primary-500" />
				</div>
			</div>
		</a>

		<!-- Players Card -->
		<a href="/admin/players" class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-primary-500 transition-colors">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Players</p>
					<p class="text-3xl font-bold">{data.stats.totalPlayers}</p>
				</div>
				<div class="p-3 bg-primary-500/10 rounded-lg">
					<Users size={24} class="text-primary-500" />
				</div>
			</div>
		</a>

		<!-- Regions Card -->
		<a href="/admin/regions" class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-primary-500 transition-colors">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Regions</p>
					<p class="text-3xl font-bold">{data.stats.totalRegions}</p>
				</div>
				<div class="p-3 bg-secondary-500/10 rounded-lg">
					<MapPin size={24} class="text-secondary-500" />
				</div>
			</div>
		</a>

		<!-- Tiles Card -->
		<a href="/admin/tiles" class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-primary-500 transition-colors">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Tiles</p>
					<p class="text-3xl font-bold">{data.stats.totalTiles}</p>
				</div>
				<div class="p-3 bg-secondary-500/10 rounded-lg">
					<Grid3x3 size={24} class="text-secondary-500" />
				</div>
			</div>
		</a>

		<!-- Plots Card -->
		<a href="/admin/plots" class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-primary-500 transition-colors">
			<div class="flex items-start justify-between">
				<div>
					<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Plots</p>
					<p class="text-3xl font-bold">{data.stats.totalPlots}</p>
				</div>
				<div class="p-3 bg-secondary-500/10 rounded-lg">
					<LayoutGrid size={24} class="text-secondary-500" />
				</div>
			</div>
		</a>
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
		</div>
	</div>
</div>
