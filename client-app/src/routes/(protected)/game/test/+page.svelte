<script lang="ts">
	import { state, connect } from '$lib/state';
	import { page } from '$app/stores';
	import { arrows, Arrow } from '$lib/stores/game/arrows';

	import { onMount } from 'svelte';
	import { Box, Button, Container, Tabs } from '@svelteuidev/core';
	import Archer from '$lib/components/game/entities/Archer.svelte';
	import { each } from 'svelte/internal';
	import ArrowComponent from '$lib/components/game/entities/Arrow.svelte';

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
	let isAttacking = false;
	let archer: Archer;
	let currentArrow;

	function handleAttackRanged(e: Event) {
		archerState = 'attack-ranged';
		isAttacking = true;

		setTimeout(() => {
			spawnArrow();

			archerState = 'idle';
			isAttacking = false;
		}, 500);
	}

	function handleAttackMelee(e: Event) {
		archerState = 'attack-melee';
		isAttacking = true;

		setTimeout(() => {
			archerState = 'idle';
			isAttacking = false;
		}, 500);
	}

	function spawnArrow() {
		let id = crypto.randomUUID();
		let name = `arrow-${id}`;

		$arrows = [...$arrows, { id, name }];

		setTimeout(() => {
			$arrows = $arrows.filter((t) => t.id !== id);
		}, 500);
	}

	$: archerState;
	$: arrows;
</script>

<Container class="mb-64 lg:max-w-7xl md:max-w-md sm:max-w-max mx-auto pb-12">
	<Button disabled={isAttacking} class="mb-2" on:click={handleAttackRanged}>Ranged Attack!</Button>
	<Button disabled={isAttacking} class="mb-2" on:click={handleAttackMelee}>Ranged Melee!</Button>
	<Box class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 bg-gray-700 pb-5">
		<Archer animState={archerState}>
			{#each $arrows as arrow}
				<ArrowComponent {arrow} />
			{/each}
		</Archer>
	</Box>
</Container>

<style>
</style>
