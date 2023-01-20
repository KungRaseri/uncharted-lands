<script lang="ts">
	import { state, connect } from '$lib/state';
	import { page } from '$app/stores';

	import { onMount } from 'svelte';
	import GameView from '$lib/components/game/View.svelte';

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

<div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
	<GameView />
</div>
