<script lang="ts">
	import type { Tile } from '@prisma/client';

	export let tile: Tile;
</script>

<div class="px-0 py-1.5 xl:py-2.5 justify-center text-center items-center text-xs">
	{tile.id}
</div>
