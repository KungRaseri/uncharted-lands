<script lang="ts">
	import type { PageData } from './$types';
	import GameNavigation from '$lib/components/game/Navigation.svelte';
	import GameFooter from '$lib/components/game/Footer.svelte';

	import * as signalR from '@microsoft/signalr';

	const connection = new signalR.HubConnectionBuilder()
		.withUrl('http://localhost:5036/hubs/game')
		.build();

	let chosenServer: string;
	let serverTime: string = '...';
	let localTime: string = '...';

	async function start() {
		try {
			await connection.start();

			connection.on('GameTick', (date: Date) => {
				let utcDate = new Date(date);
				let localDate = new Date();
				updateServerTime(
					`${utcDate.getUTCDay()}/${utcDate.getUTCMonth() + 1}/${utcDate.getUTCFullYear()}, 
					${utcDate.getUTCHours()}:${utcDate.getUTCMinutes()}:${utcDate.getUTCSeconds()}`
				);
				updateLocalTime(
					`${localDate.getDay()}/${localDate.getMonth() + 1}/${localDate.getFullYear()}, 
					${localDate.getHours()}:${localDate.getMinutes()}:${localDate.getSeconds()}`
				);
			});
		} catch (err) {
			console.log(err);
			setTimeout(start, 5000);
		}
	}

	connection.onclose(async () => {
		await start();
	});

	// Start the connection.
	start();

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

<div class="absolute top-3 z-10 right-1/3 left-1/3">
	<div class="text-xs text-neutral-400 text-center">{serverTime}</div>
	<div class="text-xs text-neutral-400 text-center">{localTime}</div>
</div>
<div>
	{#if data.account.profile}
		<GameNavigation />
	{/if}
	<slot />
	{#if data.account.profile}
		<GameFooter />
	{/if}
</div>
