<script lang="ts">
	import '@skeletonlabs/skeleton/themes/theme-crimson.css';
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../app.postcss';

	import { writable, type Writable } from 'svelte/store';
	import { AppShell, AppRail, AppRailTile, AppBar } from '@skeletonlabs/skeleton';

	import Header from '$lib/components/app/Header.svelte';
	import Footer from '$lib/components/app/Footer.svelte';

</script>

<svelte:head>
	<title>Portal | Uncharted Lands</title>
</svelte:head>

<AppShell slotPageContent="w-full h-full">
	<svelte:fragment slot="header">
		<Header />
	</svelte:fragment>

	<slot />

	<svelte:fragment slot="footer">
		<Footer />
	</svelte:fragment>
</AppShell>
