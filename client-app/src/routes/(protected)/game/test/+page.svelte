<script lang="ts">
	import { state, connect } from '$lib/state';
	import { page } from '$app/stores';

	import { onMount } from 'svelte';
	import { Box, Button, Container, Tabs } from '@svelteuidev/core';
	import Archer from '$lib/components/game/entities/Archer.svelte';

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

	let archerState = 'idle';

	$: archerState;
</script>

<Container class="mb-64 lg:max-w-7xl md:max-w-md sm:max-w-max mx-auto pb-12">
	<Archer />
</Container>

<style>
</style>
