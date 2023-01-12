<script lang="ts">
	import '../app.css';
	import { SvelteUIProvider, Switch } from '@svelteuidev/core';

	import { AppShell, Box, Container, Seo } from '@svelteuidev/core';

	import Header from '$lib/components/app/Header.svelte';
	import Footer from '$lib/components/app/Footer.svelte';

	import { onMount } from 'svelte';

	let isDarkTheme = false;

	function toggleDarkTheme() {
		isDarkTheme = !isDarkTheme;
	}

	onMount(async () => {
		// let test = await fetch(
		// 	`${
		// 		import.meta.env.VITE_API_URL
		// 	}/weather/getgeolocation?q=Wenatchee&limit=5&apiId=41ce5f680911dcb7b1fe03babaf75ad4`
		// ).then((res) => {
		// 	return res.json();
		// });
	});
</script>

<Seo title="Portal" titleTemplate="%t% | Browser-game" />
<SvelteUIProvider
	themeObserver={isDarkTheme ? 'dark' : 'light'}
	withNormalizeCSS
	withGlobalStyles
	ssr
>
	<Header {toggleDarkTheme} />
	<AppShell>
		<slot />
	</AppShell>
	<Footer classes="bg-gray-800 fixed bottom-0 inset-x-0" />
</SvelteUIProvider>
