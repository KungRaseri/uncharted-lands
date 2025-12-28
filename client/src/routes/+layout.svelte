<script lang="ts">
	import '../app.css';
	import { logger } from '$lib/utils/logger';

	import Header from '$lib/components/app/Header.svelte';
	import Footer from '$lib/components/app/Footer.svelte';
	import { onMount } from 'svelte';
	import { getProductionRates } from '$lib/api/game-config';
	import { Toast } from '@skeletonlabs/skeleton-svelte';
	import { initializeToaster } from '$lib/stores/toaster.svelte';

	let { children } = $props();

	// Initialize toaster and mount state in onMount to ensure proper component lifecycle
	let toaster = $state<any>(null);
	let mounted = $state(false);

	// Pre-load production rates on app initialization
	onMount(async () => {
		// Mark as mounted first
		mounted = true;

		// Then initialize toaster inside onMount where lifecycle hooks work
		toaster = initializeToaster();

		try {
			await getProductionRates();
			logger.debug('[App] Production rates pre-loaded successfully');
		} catch (error) {
			logger.error('[App] Failed to pre-load production rates:', error);
			// Non-critical: Calculator will load on demand with fallback
		}
	});
</script>

<div class="flex flex-col h-screen">
	<header class="flex-none">
		<Header />
	</header>

	<main class="flex-1 overflow-y-auto">
		{@render children()}
	</main>

	<footer class="flex-none">
		<Footer />
	</footer>
</div>

<!-- Toast notifications (client-side only, after mount) -->
{#if mounted && toaster}
	<Toast.Group {toaster}>
		{#snippet children(toast)}
			<Toast {toast}>
				<Toast.Message>
					<Toast.Title>{toast.title}</Toast.Title>
					<Toast.Description>{toast.description}</Toast.Description>
				</Toast.Message>
				<Toast.CloseTrigger />
			</Toast>
		{/snippet}
	</Toast.Group>
{/if}
