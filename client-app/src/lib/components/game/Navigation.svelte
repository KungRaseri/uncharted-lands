<script lang="ts">
	import { Box, Tabs } from '@svelteuidev/core';
	import Overview from './Overview.svelte';

	const navigationLinks = [
		{
			name: 'Overview',
			url: '/game',
			badge_value: 0
		},
		{
			name: 'Settlements',
			url: '/game/settlements',
			badge_value: 0
		},
		{
			name: 'Map',
			url: '/game/map',
			badge_value: 0
		},
		{
			name: 'Mine',
			url: '/game/mine',
			badge_value: 0
		}
	];

	let currentPage: number = 0;
</script>

<Box>
	<Tabs>
		<Tabs.Tab label="Overview">
			<Overview />
		</Tabs.Tab>
		<Tabs.Tab label="Settlements">
			<Overview />
		</Tabs.Tab>
		<Tabs.Tab label="Overview">
			<Overview />
		</Tabs.Tab>
		<Tabs.Tab label="Overview">
			<Overview />
		</Tabs.Tab>
		<Tabs.Tab label="Overview">
			<Overview />
		</Tabs.Tab>
	</Tabs>
</Box>
