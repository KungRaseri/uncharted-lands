<script lang="ts">
	import { Box, Card, Tabs } from '@svelteuidev/core';

	export let TileInfo: any;
</script>

<Card p="sm">
	{TileInfo.Id}
	{TileInfo.Settlement.Id}
	{TileInfo.Settlement.OwnedBy}
</Card>
