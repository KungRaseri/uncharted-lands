<script lang="ts">
	import '../app.css';
	import { logger } from '$lib/utils/logger';

	import Header from '$lib/components/app/Header.svelte';
	import Footer from '$lib/components/app/Footer.svelte';
	import { onMount } from 'svelte';
	import { getProductionRates } from '$lib/api/game-config';
	import { Toast } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/stores/toaster';

	// Pre-load production rates on app initialization
	onMount(async () => {
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
		<slot />
	</main>

	<footer class="flex-none">
		<Footer />
	</footer>
</div>

<!-- Toast notifications -->
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
