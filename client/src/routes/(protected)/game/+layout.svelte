<script lang="ts">
	import type { PageData } from './$types';
	import type { Snippet } from 'svelte';
	import { logger } from '$lib/utils/logger';
	import GameNavigation from '$lib/components/game/Navigation.svelte';
	import GameFooter from '$lib/components/game/Footer.svelte';
	import { socketStore, gameSocket } from '$lib/stores/game/socket';
	import { resourcesStore } from '$lib/stores/game/resources.svelte';
	import { populationStore } from '$lib/stores/game/population.svelte';
	import { disasterStore } from '$lib/stores/game/disaster.svelte';
	import { exposeSocketForTesting } from '$lib/utils/environment';
	import { onMount } from 'svelte';

	let { data, children }: { data: PageData; children: Snippet } = $props();

	let serverTime = $state('...');
	let localTime = $state('...');

	// Auto-connect Socket.IO and initialize stores when entering game section
	onMount(() => {
		logger.debug('[GAME LAYOUT] Initializing game connection...');

		// Only connect Socket.IO if user has both session token AND profile
		// Profile is created when user creates their first settlement
		if (data.sessionToken && data.profileId) {
			logger.debug('[GAME LAYOUT] Auto-connecting Socket.IO...');
			socketStore.connect(undefined, data.sessionToken);

			// Wait for socket connection before joining world
			const socket = socketStore.getSocket();
			if (socket) {
				socket.once('connect', () => {
					logger.debug('[GAME LAYOUT] Socket connected, now joining world...');

					// Expose socket to window for E2E testing
					if (exposeSocketForTesting && typeof window !== 'undefined') {
						(window as any).__socket = socket;
						(window as any).disasterStore = disasterStore;
						logger.debug('[GAME LAYOUT] Socket exposed to window for E2E testing');
					}

					// Join world if we have worldId
					if (data.worldId) {
						logger.debug('[GAME LAYOUT] Joining world...', {
							worldId: data.worldId,
							profileId: data.profileId
						});
						gameSocket.joinWorld(data.worldId, data.profileId);
					} else {
						logger.warn('[GAME LAYOUT] Cannot join world - missing worldId', {
							hasWorldId: !!data.worldId
						});
					}
				});
			} else {
				logger.error('[GAME LAYOUT] Failed to get socket instance');
			}
		} else {
			logger.debug(
				'[GAME LAYOUT] Skipping Socket.IO connection - user needs to create settlement first',
				{
					hasSessionToken: !!data.sessionToken,
					hasProfileId: !!data.profileId
				}
			);
		}

		// Fallback for E2E tests that need socket exposed even without profile
		if (exposeSocketForTesting && !data.profileId && typeof window !== 'undefined') {
			(window as any).__socket = null;
			logger.debug(
				'[GAME LAYOUT] Socket not connected (no profile), exposed null for E2E testing'
			);
		}

		if (!data.sessionToken) {
			logger.warn('[GAME LAYOUT] No session token - Socket.IO will not auto-connect');
		}

		return () => {
			logger.debug('[GAME LAYOUT] Cleaning up game connection...');
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
