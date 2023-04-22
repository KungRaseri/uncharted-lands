<script lang="ts">
	import type { Prisma } from '@prisma/client';
	import TileComponent from './Tile.svelte';

	export let region: Prisma.RegionGetPayload<{ include: { tiles: true } }>;
</script>

{#each region.tiles as tile}
	<TileComponent {tile} />
{/each}
