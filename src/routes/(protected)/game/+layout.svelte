<script lang="ts">
	import type { PageData } from './$types';
	import GameNavigation from '$lib/components/game/Navigation.svelte';
	import GameFooter from '$lib/components/game/Footer.svelte';

	let { data }: { data: PageData } = $props();

	let serverTime = $state('...');
	let localTime = $state('...');

	async function updateServerTime(time: string) {
		serverTime = time;
	}
	async function updateLocalTime(time: string) {
		localTime = time;
	}
</script>

<svelte:head>
	<title>Game | Uncharted Lands</title>
</svelte:head>

<div class="flex flex-col h-full">
	<!-- Time display -->
	<div class="absolute top-3 z-10 right-1/3 left-1/3">
		<div class="text-xs text-neutral-400 text-center">{serverTime}</div>
		<div class="text-xs text-neutral-400 text-center">{localTime}</div>
	</div>

	<!-- Header -->
	{#if data.account.profile}
		<header class="flex-none z-10">
			<GameNavigation />
		</header>
	{/if}

	<!-- Main content -->
	<main class="flex-1 overflow-y-auto">
		<slot />
	</main>

	<!-- Footer -->
	{#if data.account.profile}
		<footer class="flex-none">
			<GameFooter />
		</footer>
	{/if}
</div>
