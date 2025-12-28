<script lang="ts">
	/**
	 * Player List Component (ARTIFACT-05 Phase 2)
	 * 
	 * Displays online/offline players in current world
	 * - Shows status indicator (green = online, gray = offline)
	 * - Displays last seen timestamp for offline players
	 * - Auto-updates when presence changes
	 */
	
	import { presenceStore, formatLastSeen } from '$lib/stores/game/presence.svelte';
	import { User, Circle } from 'lucide-svelte';
	
	// Get reactive players list
	let players = $derived(presenceStore.players);
	let onlineCount = $derived(presenceStore.onlineCount);
	
	// Sort: online first, then by last seen
	let sortedPlayers = $derived(
		[...players].sort((a, b) => {
			if (a.isOnline && !b.isOnline) return -1;
			if (!a.isOnline && b.isOnline) return 1;
			return b.lastSeen.getTime() - a.lastSeen.getTime();
		})
	);
</script>

<div class="card preset-filled-surface-100-900 p-4">
	<div class="flex items-center justify-between mb-4">
		<div class="flex items-center gap-2">
			<User size={20} class="text-primary-500" />
			<h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
				Players in World
			</h3>
		</div>
		<span class="text-sm text-surface-600 dark:text-surface-400">
			{onlineCount} online
		</span>
	</div>

	{#if players.length === 0}
		<div class="text-center py-8 text-surface-500">
			<p class="text-sm">No players tracked yet</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each sortedPlayers as player (player.accountId)}
				<div class="flex items-center justify-between p-2 rounded hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors">
					<div class="flex items-center gap-3">
						<!-- Status indicator -->
						<div class="relative">
							<Circle 
								size={12} 
								fill={player.isOnline ? 'currentColor' : 'none'}
								class={player.isOnline 
									? 'text-success-500' 
									: 'text-surface-400'
								}
							/>
							{#if player.isOnline}
								<span class="absolute inset-0 animate-ping">
									<Circle 
										size={12} 
										fill="currentColor" 
										class="text-success-500 opacity-75"
									/>
								</span>
							{/if}
						</div>
						
						<!-- Player info -->
						<div>
							<p class="text-sm font-medium text-surface-900 dark:text-surface-100">
								{player.accountId.substring(0, 8)}...
							</p>
							{#if !player.isOnline}
								<p class="text-xs text-surface-500">
									Last seen: {formatLastSeen(player.lastSeen)}
								</p>
							{/if}
						</div>
					</div>
					
					<!-- Status badge -->
					<span 
						class="text-xs px-2 py-1 rounded-full"
					class:bg-success-100={player.isOnline}
					class:dark:bg-success-900={player.isOnline}
						class:text-success-600={player.isOnline}
						class:dark:text-success-400={player.isOnline}
						class:bg-surface-300={!player.isOnline}
						class:dark:bg-surface-700={!player.isOnline}
						class:text-surface-600={!player.isOnline}
						class:dark:text-surface-400={!player.isOnline}
					>
						{player.isOnline ? 'Online' : 'Offline'}
					</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	@keyframes ping {
		75%, 100% {
			transform: scale(2);
			opacity: 0;
		}
	}
	
	.animate-ping {
		animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
	}
</style>
