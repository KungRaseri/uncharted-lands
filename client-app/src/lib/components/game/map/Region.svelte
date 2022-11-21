<script lang="ts">
	import { Box, Tabs } from '@svelteuidev/core';
	import Tile from './Tile.svelte';

	export let RegionInfo: any;
</script>

{#each RegionInfo.Tiles as TileInfo}
	<Tile {TileInfo} />
{/each}
