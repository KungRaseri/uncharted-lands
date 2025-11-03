<script lang="ts">
	import type { PageData } from './$types';
	import { Building2, MapPin, Package, TrendingUp, AlertTriangle, Home } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	// Calculate total resources across all settlements
	let totalResources = $derived({
		food: data.settlements.reduce((sum, s) => sum + (s.Storage?.food || 0), 0),
		water: data.settlements.reduce((sum, s) => sum + (s.Storage?.water || 0), 0),
		wood: data.settlements.reduce((sum, s) => sum + (s.Storage?.wood || 0), 0),
		stone: data.settlements.reduce((sum, s) => sum + (s.Storage?.stone || 0), 0),
		ore: data.settlements.reduce((sum, s) => sum + (s.Storage?.ore || 0), 0)
	});

	let totalStructures = $derived(
		data.settlements.reduce((sum, s) => sum + (s.Structures?.length || 0), 0)
	);
</script>

<div class="max-w-7xl mx-auto p-6 space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2">
			Game Overview
		</h1>
		<p class="text-surface-600 dark:text-surface-400">
			Welcome back! Here's your empire at a glance.
		</p>
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
				<p class="text-sm text-surface-600 dark:text-surface-400">
					Total Structures
				</p>
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
				<p class="text-sm text-surface-600 dark:text-surface-400">
					Food Stores
				</p>
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
					{(totalResources.wood + totalResources.stone + totalResources.ore).toLocaleString()}
				</p>
				<p class="text-sm text-surface-600 dark:text-surface-400">
					Building Materials
				</p>
			</div>
		</div>
	</div>

	<!-- Settlements List -->
	<div class="card preset-filled-surface-100-900">
		<div class="p-6 border-b border-surface-300 dark:border-surface-700">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">
					Your Settlements
				</h2>
				<a href="/game/settlements/create" class="btn btn-sm preset-filled-primary-500 rounded-md">
					<Building2 size={16} />
					<span>New Settlement</span>
				</a>
			</div>
		</div>

		{#if data.settlements.length === 0}
			<div class="p-12 text-center">
				<Building2 size={48} class="mx-auto mb-4 text-surface-400" />
				<h3 class="text-xl font-semibold mb-2 text-surface-900 dark:text-surface-100">
					No settlements yet
				</h3>
				<p class="text-surface-600 dark:text-surface-400 mb-4">
					Start your journey by creating your first settlement
				</p>
				<a href="/game/settlements/create" class="btn preset-filled-primary-500 rounded-md">
					<Building2 size={20} />
					<span>Create Settlement</span>
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
									<Building2 size={20} class="text-primary-500 group-hover:text-white" />
									<h3 class="font-bold text-lg text-surface-900 dark:text-surface-100 group-hover:text-white">
										{settlement.name}
									</h3>
								</div>
								<span class="badge preset-filled-success-500 text-xs">Active</span>
							</div>

							<div class="space-y-2 text-sm">
								<div class="flex items-center gap-2 text-surface-600 dark:text-surface-400 group-hover:text-white/80">
									<MapPin size={14} />
									<span>Plot: {settlement.plotId.slice(0, 8)}...</span>
								</div>
								<div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-surface-300 dark:border-surface-600 group-hover:border-white/20">
									<div>
										<p class="text-xs text-surface-500 dark:text-surface-500 group-hover:text-white/60">Structures</p>
										<p class="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-white">
											{settlement.Structures?.length || 0}
										</p>
									</div>
									<div>
										<p class="text-xs text-surface-500 dark:text-surface-500 group-hover:text-white/60">Food</p>
										<p class="font-semibold text-surface-900 dark:text-surface-100 group-hover:text-white">
											{settlement.Storage?.food || 0}
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
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<a
			href="/game/map"
			class="card preset-filled-surface-100-900 p-6 hover:preset-tonal-primary-500 transition-colors group"
		>
			<MapPin size={32} class="text-primary-500 group-hover:text-white mb-3" />
			<h3 class="text-lg font-bold mb-2 text-surface-900 dark:text-surface-100 group-hover:text-white">
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
			<h3 class="text-lg font-bold mb-2 text-surface-900 dark:text-surface-100 group-hover:text-white">
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
			<AlertTriangle size={32} class="text-tertiary-500 group-hover:text-white mb-3" />
			<h3 class="text-lg font-bold mb-2 text-surface-900 dark:text-surface-100 group-hover:text-white">
				Wardens
			</h3>
			<p class="text-sm text-surface-600 dark:text-surface-400 group-hover:text-white/80">
				Protect your settlements from threats
			</p>
		</a>
	</div>
</div>
