<script lang="ts">
	import '@skeletonlabs/skeleton/themes/theme-crimson.css';
	import '@skeletonlabs/skeleton/styles/all.css';
	import '../app.postcss';

	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { slide } from 'svelte/transition';

	import { writable, type Writable } from 'svelte/store';
	import { AppShell, AppRail, AppRailTile, AppBar } from '@skeletonlabs/skeleton';

	import Header from '$lib/components/app/Header.svelte';
	import Footer from '$lib/components/app/Footer.svelte';

	let isDarkTheme = false;
	let isMainMenuOpen = false;

	function toggleMainMenu(event) {
		isMainMenuOpen = !isMainMenuOpen;
	}

	function toggleDarkTheme() {
		isDarkTheme = !isDarkTheme;
	}

	const storeValue: Writable<number> = writable(1);

	export let data: PageData;
</script>

<svelte:head>
	<title>Portal | Uncharted Lands</title>
</svelte:head>

<AppShell slotPageContent="w-full h-full">
	<svelte:fragment slot="header">
		<Header
			{isMainMenuOpen}
			on:toggleMainMenu={toggleMainMenu}
		/>
	</svelte:fragment>

	<slot />

	<svelte:fragment slot="footer">
		<Footer />
	</svelte:fragment>
</AppShell>
