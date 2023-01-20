<script lang="ts">
	import Tile from './Tile.svelte';

	export let RegionInfo: any;
</script>

{#each RegionInfo.Tiles as TileInfo}
	<Tile {TileInfo} />
{/each}
