<script lang="ts">
	import { Box, Container, Tabs } from '@svelteuidev/core';
	import GameNavigation from '$lib/components/game/Navigation.svelte';
	import GameFooter from '$lib/components/game/Footer.svelte';

	import * as signalR from '@microsoft/signalr';

	const connection = new signalR.HubConnectionBuilder()
		.withUrl('http://localhost:5036/hubs/game')
		.build();

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

			console.log('SignalR Connected.');
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
</script>

<div class="mx-auto text-sm text-gray-500 text-center">{serverTime}</div>
<div class="mx-auto text-sm text-gray-500 text-center">{localTime}</div>
<Container>
	<GameNavigation />
	<slot />
	<GameFooter />
</Container>
