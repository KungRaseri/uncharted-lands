<script lang="ts">
	import type { PageData } from './$types';
	import type { Snippet } from 'svelte';
	import GameNavigation from '$lib/components/game/Navigation.svelte';
	import GameFooter from '$lib/components/game/Footer.svelte';
	import { onMount } from 'svelte';

	let { data, children }: { data: PageData; children: Snippet } = $props();

	let serverTime = $state('...');
	let localTime = $state('...');

	// Update times periodically
	onMount(() => {
		const updateTimes = () => {
			const now = new Date();
			localTime = now.toLocaleTimeString();
			// For now, assume server time is same as local (update when server API available)
			serverTime = now.toUTCString().split(' ')[4] + ' UTC';
		};

		updateTimes();
		const interval = setInterval(updateTimes, 1000);

		return () => clearInterval(interval);
	});
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
		{@render children()}
	</main>

	<!-- Footer -->
	{#if data.account.profile}
		<footer class="flex-none">
			<GameFooter />
		</footer>
	{/if}
</div>
