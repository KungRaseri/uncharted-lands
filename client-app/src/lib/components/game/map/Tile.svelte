<script lang="ts">
	import { Box, Card, Tabs } from '@svelteuidev/core';

	export let TileInfo: any;
</script>

<Card p={0} m={0}>
		<Box m="md">{TileInfo.Id}</Box>
</Card>
