<script lang="ts">
	import '../app.css';
	import { SvelteUIProvider } from '@svelteuidev/core';

	import { AppShell, Box, Container, Seo } from '@svelteuidev/core';

	import Header from '$lib/components/app/Header.svelte';
	import Footer from '$lib/components/app/Footer.svelte';

	import { onMount } from 'svelte';

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
<SvelteUIProvider themeObserver="dark" withNormalizeCSS withGlobalStyles ssr>
	<AppShell class="bg-gray-800 ">
		<Header classes="pb-32" />

		<Container class="-mt-32 min-h-min mb-64 lg:max-w-7xl md:max-w-md sm:max-w-max mx-auto pb-12">
			<Box class="bg-indigo-50 rounded-lg shadow px-5 py-6 sm:px-6">
				<slot />
			</Box>
		</Container>

		<Footer classes="bg-gray-700 fixed bottom-0 inset-x-0 lg:h-53 sm:h-30" />
	</AppShell>
</SvelteUIProvider>
