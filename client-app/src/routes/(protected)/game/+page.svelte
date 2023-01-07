<script lang="ts">
	import { state, connect } from '$lib/state';
	import { page } from '$app/stores';

	import { onMount } from 'svelte';
	import { Box, Container, Tabs } from '@svelteuidev/core';
	import GameNav from '$lib/components/game/Navigation.svelte';

	onMount(async () => {
		// let test = await fetch(
		// 	`${
		// 		import.meta.env.VITE_API_URL
		// 	}/weather/getgeolocation?q=Wenatchee&limit=5&apiId=41ce5f680911dcb7b1fe03babaf75ad4`
		// ).then((res) => {
		// 	return res.json();
		// });
		// console.log('mounted', test);
	});
</script>

<Container class="min-h-min mb-64 lg:max-w-7xl md:max-w-md sm:max-w-max mx-auto pb-12">
	<Box class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
		<GameNav />
	</Box>
</Container>
