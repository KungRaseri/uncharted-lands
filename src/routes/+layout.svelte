<script lang="ts">
	import '@skeletonlabs/skeleton/themes/theme-crimson.css';
	import '@skeletonlabs/skeleton/styles/skeleton.css';
	import '../app.postcss';

	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { AppShell, storePopup } from '@skeletonlabs/skeleton';

	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

	import Header from '$lib/components/app/Header.svelte';
</script>

<AppShell slotPageContent="overflow-y-scroll">
	<svelte:fragment slot="header">
		<Header />
	</svelte:fragment>

	<slot />
</AppShell>
