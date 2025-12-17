<script lang="ts">
	import { Globe, Server, Wifi } from 'lucide-svelte';
	import { socketStore } from '$lib/stores/game/socket';

	interface Props {
		server: { name: string; worlds: { id: string; name: string }[] } | null;
	}

	let { server }: Props = $props();

	// Derive server and world names from prop with fallbacks
	let serverName = $derived(server?.name || 'Unknown Server');
	let worldName = $derived(server?.worlds?.[0]?.name || 'Unknown World');

	// Subscribe to socket connection state and ping
	let connectionState = $state<'connected' | 'connecting' | 'disconnected' | 'error'>(
		'disconnected'
	);
	let lastPing = $state<number | null>(null);
	let socketId = $state<string | null>(null);

	socketStore.subscribe((store) => {
		connectionState = store.connectionState;
		lastPing = store.lastPing;
		socketId = store.socket?.id || null;
	});

	// Format last ping time
	let lastPingTime = $derived(() => {
		if (!lastPing) return 'Never';
		const seconds = Math.floor((Date.now() - lastPing) / 1000);
		if (seconds < 60) return `${seconds}s ago`;
		const minutes = Math.floor(seconds / 60);
		return `${minutes}m ago`;
	});
</script>

<footer
	class="bg-surface-100 dark:bg-surface-800 border-t border-surface-300 dark:border-surface-700"
>
	<div class="max-w-7xl mx-auto px-4">
		<div class="flex items-center justify-between h-10 text-xs">
			<!-- Server Info -->
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2">
					<Server size={14} class="text-surface-500" />
					<span class="text-surface-600 dark:text-surface-400">{serverName}</span>
				</div>
				<div class="flex items-center gap-2">
					<Globe size={14} class="text-surface-500" />
					<span class="text-surface-600 dark:text-surface-400">{worldName}</span>
				</div>
			</div>

			<!-- Connection Status with Hover Tooltip -->
			<div class="relative group">
				<div class="flex items-center gap-2 cursor-help">
					<Wifi
						size={14}
						class={connectionState === 'connected'
							? 'text-success-500'
							: connectionState === 'disconnected'
								? 'text-error-500'
								: 'text-warning-500'}
					/>
					<span class="text-surface-600 dark:text-surface-400 capitalize">
						{connectionState === 'connected'
							? 'Online'
							: connectionState === 'disconnected'
								? 'Disconnected'
								: 'Connecting'}
					</span>
				</div>

				<!-- Tooltip -->
				<div class="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
					<div
						class="bg-surface-900 text-surface-100 text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap"
					>
						<div class="font-semibold mb-1">Connection Status</div>
						<div class="space-y-1 text-surface-300">
							<div>State: <span class="capitalize">{connectionState}</span></div>
							{#if socketId}
								<div>
									Socket ID: <span class="font-mono text-[10px]"
										>{socketId.slice(0, 8)}...</span
									>
								</div>
							{/if}
							<div>Last Ping: {lastPingTime()}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</footer>
