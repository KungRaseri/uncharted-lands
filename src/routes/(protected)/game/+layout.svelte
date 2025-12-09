<script lang="ts">
	import type { PageData } from './$types';
	import type { Snippet } from 'svelte';
	import GameNavigation from '$lib/components/game/Navigation.svelte';
	import GameFooter from '$lib/components/game/Footer.svelte';
	import { socketStore, gameSocket } from '$lib/stores/game/socket';
	import { resourcesStore } from '$lib/stores/game/resources.svelte';
	import { populationStore } from '$lib/stores/game/population.svelte';
	import { onMount } from 'svelte';

	let { data, children }: { data: PageData; children: Snippet } = $props();

	let serverTime = $state('...');
	let localTime = $state('...');

	// Auto-connect Socket.IO and initialize stores when entering game section
	onMount(() => {
		console.log('[GAME LAYOUT] Initializing game connection...');

		// Auto-connect Socket.IO if we have a session token
		if (data.sessionToken) {
			console.log('[GAME LAYOUT] Auto-connecting Socket.IO...');
			socketStore.connect(undefined, data.sessionToken);

			// Expose socket to window for E2E testing
			if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
				const socket = socketStore.getSocket();
				if (socket && typeof window !== 'undefined') {
					(window as any).__socket = socket;
					console.log('[GAME LAYOUT] Socket exposed to window for E2E testing');
				}
			}

			// Join world if we have both worldId and profileId
			if (data.worldId && data.profileId) {
				console.log('[GAME LAYOUT] Joining world...', {
					worldId: data.worldId,
					profileId: data.profileId
				});
				gameSocket.joinWorld(data.worldId, data.profileId);
			} else {
				console.warn('[GAME LAYOUT] Cannot join world - missing worldId or profileId', {
					hasWorldId: !!data.worldId,
					hasProfileId: !!data.profileId
				});
			}
		} else {
			console.warn('[GAME LAYOUT] No session token - Socket.IO will not auto-connect');
		}

		return () => {
			console.log('[GAME LAYOUT] Cleaning up game connection...');
			// Leave world and disconnect Socket.IO when leaving game section
			if (data.worldId && data.profileId) {
				gameSocket.leaveWorld(data.worldId, data.profileId);
			}
			socketStore.disconnect();

			// Clean up window exposure
			if (typeof window !== 'undefined') {
				delete (window as any).__socket;
			}
		};
	});

	$effect(() => {
		const updateTimes = () => {
			const now = new Date();
			localTime = now.toLocaleTimeString();
			serverTime = now.toUTCString().split(' ')[4] + ' UTC';
		};

		updateTimes();
		const interval = setInterval(updateTimes, 1000);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Game | Uncharted Lands</title>
</svelte:head>

<!-- Time display - positioned above everything -->
<div class="fixed top-2 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none min-w-[200px]">
	<div class="text-xs text-neutral-400 text-center font-medium">{serverTime}</div>
	<div class="text-xs text-neutral-400 text-center">{localTime}</div>
</div>

<div class="flex flex-col h-full">
	<!-- Header -->
	{#if data.account?.profile}
		<header class="flex-none z-10">
			<GameNavigation />
		</header>
	{/if}

	<!-- Main content -->
	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>

	<!-- Footer -->
	{#if data.account?.profile}
		<footer class="flex-none">
			<GameFooter server={data.server} />
		</footer>
	{/if}
</div>
