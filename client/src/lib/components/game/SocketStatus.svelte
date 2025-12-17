<script lang="ts">
	import { socketStore, connectionState, connectionError } from '$lib/stores/game/socket';
	import { PUBLIC_WS_URL } from '$env/static/public';
	import { onMount, onDestroy } from 'svelte';

	let { sessionToken }: { sessionToken?: string | null } = $props();

	let showDetails = $state(false);

	// Extract just the host:port for display
	const serverDisplay = PUBLIC_WS_URL.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '');

	onMount(() => {
		// Connect to server when component mounts, passing the session token
		socketStore.connect(undefined, sessionToken || undefined);
	});

	onDestroy(() => {
		// Disconnect when component unmounts
		socketStore.disconnect();
	});

	const statusColor = $derived(
		{
			connected: 'bg-green-500',
			connecting: 'bg-yellow-500',
			disconnected: 'bg-gray-500',
			error: 'bg-red-500'
		}[$connectionState]
	);

	const statusText = $derived(
		{
			connected: 'Connected',
			connecting: 'Connecting...',
			disconnected: 'Disconnected',
			error: 'Connection Error'
		}[$connectionState]
	);
</script>

<div class="fixed bottom-4 right-4 z-50">
	<button
		onclick={() => (showDetails = !showDetails)}
		class="flex items-center gap-2 rounded-lg bg-surface-800 px-4 py-2 text-sm shadow-lg transition-all hover:bg-surface-700"
		title="Socket Connection Status"
	>
		<div class="relative">
			<div class="h-2 w-2 rounded-full {statusColor}"></div>
			{#if $connectionState === 'connecting'}
				<div class="absolute inset-0 h-2 w-2 animate-ping rounded-full {statusColor}"></div>
			{/if}
		</div>
		<span class="font-medium">{statusText}</span>
	</button>

	{#if showDetails}
		<div class="mt-2 rounded-lg bg-surface-800 p-4 shadow-xl" style="min-width: 250px;">
			<h3 class="mb-2 text-sm font-bold">Connection Details</h3>
			<div class="space-y-1 text-xs">
				<div class="flex justify-between">
					<span class="text-surface-400">Status:</span>
					<span class="font-medium">{statusText}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-surface-400">Server:</span>
					<span class="font-mono">{serverDisplay}</span>
				</div>
				{#if $connectionError}
					<div class="mt-2 rounded bg-red-900/20 p-2 text-red-400">
						{$connectionError}
					</div>
				{/if}
				{#if $connectionState === 'disconnected' || $connectionState === 'error'}
					<button
						onclick={() => socketStore.connect(undefined, sessionToken || undefined)}
						class="mt-2 w-full rounded bg-primary-600 px-3 py-1 text-xs font-medium hover:bg-primary-700"
					>
						Reconnect
					</button>
				{/if}
			</div>
		</div>
	{/if}
</div>
