<script lang="ts">
	import type { Prisma, Tile } from '@prisma/client';

	export let tile: Prisma.TileGetPayload<{ include: { Biome: true; Plots: true } }>;
</script>

<div
	class="px-0 py-1.5
	justify-center text-center items-center text-xs
	"
	style="background: rgb({tile.elevation * 255}, {tile.elevation * 255}, {tile.elevation * 255})"
>
	<!-- {x}.{y} -->
</div>
