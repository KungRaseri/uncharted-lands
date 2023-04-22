<script lang="ts">
	import { AppShell } from '@skeletonlabs/skeleton';
	import type { PageData } from './$types';
	import GameNavigation from '$lib/components/game/Navigation.svelte';
	import GameFooter from '$lib/components/game/Footer.svelte';

	let serverTime: string = '...';
	let localTime: string = '...';

	async function updateServerTime(time: string) {
		serverTime = time;
	}
	async function updateLocalTime(time: string) {
		localTime = time;
	}

	$: serverTime;
	$: localTime;
	$: data;

	export let data: PageData;
</script>

<svelte:head>
	<title>Game | Uncharted Lands</title>
</svelte:head>

<div class="absolute top-3 z-10 right-1/3 left-1/3">
	<div class="text-xs text-neutral-400 text-center">{serverTime}</div>
	<div class="text-xs text-neutral-400 text-center">{localTime}</div>
</div>

<AppShell slotPageHeader="z-10">
	<svelte:fragment slot="pageHeader">
		{#if data.account.profile}
			<GameNavigation />
		{/if}
	</svelte:fragment>

	<slot />

	<svelte:fragment slot="pageFooter">
		{#if data.account.profile}
			<GameFooter />
		{/if}
	</svelte:fragment>
</AppShell>
