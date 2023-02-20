<script lang="ts">
	import type { Region, World } from '@prisma/client';
	import Tile from './Tile.svelte';

	export let map: World;
</script>

<div class="grid grid-cols-10 p-0 border-token w-full xl:w-5/6 mx-auto">
	{#each map.regions as region}
		<div class="p-0 border-token">
			<a href="/admin/regions/{region.id}">
				{#each region.elevationMap as elevationRow, x}
					<div class="grid grid-cols-10 p-0">
						{#each elevationRow as elevationColumn, y}
							<div
								class="
								px-0 py-1.5 xl:py-2.5 
								justify-center text-center items-center text-xs
							"
								style="background: 
								rgb({elevationColumn * 255}, {elevationColumn * 255}, {elevationColumn * 255})"
							>
								<!-- {x}.{y} -->
							</div>
						{/each}
					</div>
				{/each}
			</a>
		</div>
	{/each}
</div>
