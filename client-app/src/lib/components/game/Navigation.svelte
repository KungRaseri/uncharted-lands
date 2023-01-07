<script lang="ts">
	import { Box, Tabs } from '@svelteuidev/core';
	import World from './map/World.svelte';
	import Overview from './overview/Overview.svelte';
</script>

<Box>
	<Tabs>
		<Tabs.Tab label="Overview">
			<Overview />
		</Tabs.Tab>
		<Tabs.Tab label="Settlements">
			<Overview />
		</Tabs.Tab>
		<!-- <Tabs.Tab label="World">
			<World />
		</Tabs.Tab> -->
		<Tabs.Tab label="Overview">
			<Overview />
		</Tabs.Tab>
		<Tabs.Tab label="Overview">
			<Overview />
		</Tabs.Tab>
	</Tabs>
</Box>
