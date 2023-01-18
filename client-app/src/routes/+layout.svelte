<script lang="ts">
	import '../app.css';
	import { SvelteUIProvider, Switch } from '@svelteuidev/core';

	import { AppShell, Box, Container, Seo } from '@svelteuidev/core';

	import Header from '$lib/components/app/Header.svelte';
	import Footer from '$lib/components/app/Footer.svelte';

	import { onMount } from 'svelte';
	import type { PageData } from './$types';

	let isDarkTheme = false;

	function toggleDarkTheme() {
		isDarkTheme = !isDarkTheme;
	}

	export let data: PageData;
</script>

<Seo title="Portal" titleTemplate="%t% | Uncharted Lands" />
<SvelteUIProvider
	themeObserver={isDarkTheme ? 'dark' : 'light'}
	withNormalizeCSS
	withGlobalStyles
	ssr
>
	<Header {toggleDarkTheme} mainMenuLinks={data.mainMenuLinks} userMenuLinks={data.userMenuLinks}/>
	<AppShell>
		<slot />
	</AppShell>
	<!-- <Footer classes="bg-gray-800 fixed bottom-0 inset-x-0" /> -->
</SvelteUIProvider>