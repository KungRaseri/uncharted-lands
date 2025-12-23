<script lang="ts">
	import type { PageData } from './$types';
	import type { SettlementWithStorage } from '@uncharted-lands/shared';
	import {
		Building2,
		MapPin,
		Package,
		TrendingUp,
		AlertTriangle,
		Home,
		RefreshCw,
		Shield,
		User,
		Clock,
		MessageSquare,
		Users
	} from 'lucide-svelte';
	import { createGameRefreshInterval, refreshGameData } from '$lib/stores/game/gameState.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();

	// Check for error message in URL
	let showNoWorldError = $derived($page.url.searchParams.get('error') === 'no-world');

	// State for UI feedback
	let isRefreshing = $state(false);

	// Manual refresh function
	async function handleManualRefresh() {
		isRefreshing = true;
		refreshGameData('game:settlements');
		// Give visual feedback
		setTimeout(() => {
			isRefreshing = false;
		}, 500);
	}

	onMount(() => {
		// Auto-refresh every minute to catch tick updates
		const cleanup = createGameRefreshInterval('game:settlements');
		return cleanup;
	});

	// Use aggregate data from server if available, fallback to client calculation
	let totalResources = $derived(
		data.aggregateData?.totalResources || {
			food: data.settlements.reduce(
				(sum: number, s: SettlementWithStorage) => sum + (s.storage?.food || 0),
				0
			),
			water: data.settlements.reduce(
				(sum: number, s: SettlementWithStorage) => sum + (s.storage?.water || 0),
				0
			),
			wood: data.settlements.reduce(
				(sum: number, s: SettlementWithStorage) => sum + (s.storage?.wood || 0),
				0
			),
			stone: data.settlements.reduce(
				(sum: number, s: SettlementWithStorage) => sum + (s.storage?.stone || 0),
				0
			),
			ore: data.settlements.reduce(
				(sum: number, s: SettlementWithStorage) => sum + (s.storage?.ore || 0),
				0
			)
		}
	);

	let totalPopulation = $derived(data.aggregateData?.totalPopulation || 0);

	let totalStructures = $derived(
		data.settlements.reduce(
			(sum: number, s: SettlementWithStorage) => sum + (s.structures?.length || 0),
			0
		)
	);

	// State for expandable resource breakdown
	let showResourceBreakdown = $state(false);
</script>

<div class="max-w-7xl mx-auto p-6 space-y-6">
	<!-- No World Error Alert -->
	{#if showNoWorldError}
		<aside class="alert preset-filled-warning-500 rounded-md">
			<div class="alert-message">
				<AlertTriangle size={20} />
				<div>
					<h3 class="font-bold">World Not Available</h3>
					<p>
						The game world hasn't been created yet. Please contact an administrator to
						set up the world before accessing the map.
					</p>
				</div>
			</div>
		</aside>
	{/if}

	<!-- Header -->
	<div class="flex items-start justify-between">
		<div>
			<h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2">
				Game Overview
			</h1>
			<p class="text-surface-600 dark:text-surface-400">
				Welcome back! Here's your empire at a glance.
			</p>
		</div>
		<button
			onclick={handleManualRefresh}
			disabled={isRefreshing}
			class="btn preset-tonal-surface-500 rounded-md"
			title="Refresh data (auto-refreshes every minute)"
		>
			<RefreshCw size={16} class={isRefreshing ? 'animate-spin' : ''} />
			<span class="hidden sm:inline">Refresh</span>
		</button>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Settlements -->
		<div class="card preset-filled-surface-100-900 p-5">
			<div class="flex items-center justify-between mb-3">
				<div class="p-3 bg-primary-500/10 rounded-lg">
					<Building2 size={24} class="text-primary-500" />
				</div>
				<a href="/game/settlements" class="text-xs text-primary-500 hover:underline">
					View All
				</a>
			</div>
			<div>
				<p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
					{data.settlements.length}
				</p>
				<p class="text-sm text-surface-600 dark:text-surface-400">
					Settlement{data.settlements.length === 1 ? '' : 's'}
				</p>
			</div>
		</div>

		<!-- Structures -->
		<div class="card preset-filled-surface-100-900 p-5">
			<div class="flex items-center justify-between mb-3">
				<div class="p-3 bg-secondary-500/10 rounded-lg">
					<Home size={24} class="text-secondary-500" />
				</div>
			</div>
			<div>
				<p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
					{totalStructures}
				</p>
				<p class="text-sm text-surface-600 dark:text-surface-400">Total Structures</p>
			</div>
		</div>

		<!-- Food -->
		<div class="card preset-filled-surface-100-900 p-5">
			<div class="flex items-center justify-between mb-3">
				<div class="p-3 bg-success-500/10 rounded-lg">
					<Package size={24} class="text-success-500" />
				</div>
			</div>
			<div>
				<p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
					{totalResources.food.toLocaleString()}
				</p>
				<p class="text-sm text-surface-600 dark:text-surface-400">Food Stores</p>
			</div>
		</div>

		<!-- Resources -->
		<div class="card preset-filled-surface-100-900 p-5">
			<div class="flex items-center justify-between mb-3">
				<div class="p-3 bg-warning-500/10 rounded-lg">
					<TrendingUp size={24} class="text-warning-500" />
				</div>
			</div>
			<div>
				<p class="text-2xl font-bold text-surface-900 dark:text-surface-100">
					{(
						totalResources.wood +
						totalResources.stone +
						totalResources.ore
					).toLocaleString()}
				</p>
				<p class="text-sm text-surface-600 dark:text-surface-400">Building Materials</p>
			</div>
		</div>
	</div>

	<!-- Aggregate Resources Breakdown (Expandable) -->
	{#if data.aggregateData}
		<div class="card preset-filled-surface-100-900">
			<div class="p-6 border-b border-surface-300 dark:border-surface-700">
				<div class="flex items-center justify-between">
					<h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">
						Total Resources (All Settlements)
					</h2>
					<button
						onclick={() => (showResourceBreakdown = !showResourceBreakdown)}
						class="btn btn-sm preset-tonal-surface-500 rounded-md"
					>
						{showResourceBreakdown ? 'Hide' : 'Show'} Breakdown
					</button>
				</div>
			</div>

			<div class="p-6 space-y-4">
				<!-- Total Resources Grid -->
				<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
					<div class="text-center">
						<div class="text-2xl font-bold text-success-500">
							{data.aggregateData.totalResources.food.toLocaleString()}
						</div>
						<div class="text-sm text-surface-600 dark:text-surface-400">Food</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-info-500">
							{data.aggregateData.totalResources.water.toLocaleString()}
						</div>
						<div class="text-sm text-surface-600 dark:text-surface-400">Water</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-warning-500">
							{data.aggregateData.totalResources.wood.toLocaleString()}
						</div>
						<div class="text-sm text-surface-600 dark:text-surface-400">Wood</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-surface-500">
							{data.aggregateData.totalResources.stone.toLocaleString()}
						</div>
						<div class="text-sm text-surface-600 dark:text-surface-400">Stone</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-tertiary-500">
							{data.aggregateData.totalResources.ore.toLocaleString()}
						</div>
						<div class="text-sm text-surface-600 dark:text-surface-400">Ore</div>
					</div>
				</div>

				<!-- Total Stats -->
				<div class="flex items-center justify-around pt-4 border-t border-surface-300 dark:border-surface-700">
					<div class="text-center">
						<div class="text-xl font-bold text-surface-900 dark:text-surface-100">
							{data.aggregateData.settlementCount}
						</div>
						<div class="text-xs text-surface-600 dark:text-surface-400">Settlements</div>
					</div>
					<div class="text-center">
						<div class="text-xl font-bold text-surface-900 dark:text-surface-100">
							{data.aggregateData.totalPopulation.toLocaleString()}
						</div>
						<div class="text-xs text-surface-600 dark:text-surface-400">Total Population</div>
					</div>
					<div class="text-center">
						<div class="text-xl font-bold text-surface-900 dark:text-surface-100">
							{data.aggregateData.totalCapacity.toLocaleString()}
						</div>
						<div class="text-xs text-surface-600 dark:text-surface-400">Total Capacity</div>
					</div>
				</div>

				<!-- Per-Settlement Breakdown (Expandable) -->
				{#if showResourceBreakdown}
					<div class="pt-4 border-t border-surface-300 dark:border-surface-700 space-y-3">
						<h3 class="text-sm font-semibold text-surface-700 dark:text-surface-300">
							Per-Settlement Breakdown
						</h3>
						{#each data.aggregateData.settlements as settlement}
							<div class="card preset-filled-surface-50-950 p-4">
								<div class="flex items-center justify-between mb-2">
									<h4 class="font-semibold text-surface-900 dark:text-surface-100">
										{settlement.name}
									</h4>
									<span class="text-xs text-surface-600 dark:text-surface-400">
										Pop: {settlement.population}/{settlement.capacity}
									</span>
								</div>
								<div class="grid grid-cols-5 gap-2 text-sm">
									<div class="text-center">
										<div class="font-bold text-success-500">
											{settlement.resources.food.toLocaleString()}
										</div>
										<div class="text-xs text-surface-600 dark:text-surface-400">
											Food
										</div>
									</div>
									<div class="text-center">
										<div class="font-bold text-info-500">
											{settlement.resources.water.toLocaleString()}
										</div>
										<div class="text-xs text-surface-600 dark:text-surface-400">
											Water
										</div>
									</div>
									<div class="text-center">
										<div class="font-bold text-warning-500">
											{settlement.resources.wood.toLocaleString()}
										</div>
										<div class="text-xs text-surface-600 dark:text-surface-400">
											Wood
										</div>
									</div>
									<div class="text-center">
										<div class="font-bold text-surface-500">
											{settlement.resources.stone.toLocaleString()}
										</div>
										<div class="text-xs text-surface-600 dark:text-surface-400">
											Stone
										</div>
									</div>
									<div class="text-center">
										<div class="font-bold text-tertiary-500">
											{settlement.resources.ore.toLocaleString()}
										</div>
										<div class="text-xs text-surface-600 dark:text-surface-400">
											Ore
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Settlements List -->
	<div class="card preset-filled-surface-100-900">
		<div class="p-6 border-b border-surface-300 dark:border-surface-700">
			<h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">
				Your Settlements
			</h2>
		</div>

		{#if data.settlements.length === 0}
			<div class="p-12 text-center">
				<Building2 size={48} class="mx-auto mb-4 text-surface-400" />
				<h3 class="text-xl font-semibold mb-2 text-surface-900 dark:text-surface-100">
					No settlements yet
				</h3>
				<p class="text-surface-600 dark:text-surface-400 mb-4">
					You haven't created your first settlement yet. Start by going through the
					getting started flow.
				</p>
				<a href="/game/getting-started" class="btn preset-filled-primary-500 rounded-md">
					<Building2 size={20} />
					<span>Get Started</span>
				</a>
			</div>
		{:else}
			<div class="p-6">
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each data.settlements as settlement}
						<a
							href="/game/settlements/{settlement.id}"
							class="card preset-filled-surface-200-700 p-5 hover:preset-tonal-primary-500 transition-colors group"
						>
							<div class="flex items-start justify-between mb-3">
								<div class="flex items-center gap-2">
									<Building2
										size={20}
										class="text-primary-500 group-hover:text-white"
									/>
									<h3
										class="font-bold text-lg text-surface-900 dark:text-surface-100 group-hover:text-white"
									>
										{settlement.name}
									</h3>
								</div>
								<span class="badge preset-filled-success-500 text-xs">Active</span>
							</div>

							<div class="space-y-2 text-sm">
								<div
									class="flex items-center gap-2 text-surface-600 dark:text-surface-400 group-hover:text-white/80"
								>
									<MapPin size={14} />
									<span>Tile: {settlement.tileId.slice(0, 8)}...</span>
								</div>
								<div
									class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-surface-300 dark:border-surface-600 group-hover:border-white/20"
								>
									<div>
										<p
											class="text-xs text-surface-500 dark:text-surface-500 group-hover:text-white/60"
										>
											Structures
										</p>
										<p
											class="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-white"
										>
											{settlement.structures?.length || 0}
										</p>
									</div>
									<div>
										<p
											class="text-xs text-surface-500 dark:text-surface-500 group-hover:text-white/60"
										>
											Food
										</p>
										<p
											class="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-white"
										>
											{settlement.storage?.food || 0}
										</p>
									</div>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Quick Actions -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
		<a
			href="/game/map"
			class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-primary-500 transition-colors group"
		>
			<MapPin size={32} class="text-primary-500 group-hover:text-white mb-3" />
			<h3
				class="text-lg font-bold mb-2 text-surface-900 dark:text-surface-100 group-hover:text-white"
			>
				Explore Map
			</h3>
			<p class="text-sm text-surface-600 dark:text-surface-400 group-hover:text-white/80">
				View the world map and discover new territories
			</p>
		</a>

		<a
			href="/game/settlements"
			class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-secondary-500 transition-colors group"
		>
			<Building2 size={32} class="text-secondary-500 group-hover:text-white mb-3" />
			<h3
				class="text-lg font-bold mb-2 text-surface-900 dark:text-surface-100 group-hover:text-white"
			>
				Manage Settlements
			</h3>
			<p class="text-sm text-surface-600 dark:text-surface-400 group-hover:text-white/80">
				View and manage all your settlements
			</p>
		</a>

		<a
			href="/game/wardens"
			class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-tertiary-500 transition-colors group"
		>
			<Shield size={32} class="text-tertiary-500 group-hover:text-white mb-3" />
			<h3
				class="text-lg font-bold mb-2 text-surface-900 dark:text-surface-100 group-hover:text-white"
			>
				Wardens
			</h3>
			<p class="text-sm text-surface-600 dark:text-surface-400 group-hover:text-white/80">
				Manage your settlement defenses
			</p>
		</a>

		<a
			href="/game/profile"
			class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-success-500 transition-colors group"
		>
			<User size={32} class="text-success-500 group-hover:text-white mb-3" />
			<h3
				class="text-lg font-bold mb-2 text-surface-900 dark:text-surface-100 group-hover:text-white"
			>
				Profile
			</h3>
			<p class="text-sm text-surface-600 dark:text-surface-400 group-hover:text-white/80">
				View your player profile and statistics
			</p>
		</a>

		<a
			href="/game/history"
			class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-warning-500 transition-colors group"
		>
			<Clock size={32} class="text-warning-500 group-hover:text-white mb-3" />
			<h3
				class="text-lg font-bold mb-2 text-surface-900 dark:text-surface-100 group-hover:text-white"
			>
				History
			</h3>
			<p class="text-sm text-surface-600 dark:text-surface-400 group-hover:text-white/80">
				View your activity history
			</p>
		</a>

		<a
			href="/game/messages"
			class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-error-500 transition-colors group"
		>
			<MessageSquare size={32} class="text-error-500 group-hover:text-white mb-3" />
			<h3
				class="text-lg font-bold mb-2 text-surface-900 dark:text-surface-100 group-hover:text-white"
			>
				Messages
			</h3>
			<p class="text-sm text-surface-600 dark:text-surface-400 group-hover:text-white/80">
				Private messages with other players
			</p>
		</a>

		<a
			href="/game/guild"
			class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-primary-500 transition-colors group"
		>
			<Users size={32} class="text-primary-500 group-hover:text-white mb-3" />
			<h3
				class="text-lg font-bold mb-2 text-surface-900 dark:text-surface-100 group-hover:text-white"
			>
				Guild
			</h3>
			<p class="text-sm text-surface-600 dark:text-surface-400 group-hover:text-white/80">
				Your guild information and members
			</p>
		</a>
	</div>
</div>
