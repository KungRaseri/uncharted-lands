<script lang="ts">
	import type { Region } from '@prisma/client';

	export let regions: Region[];
</script>

<div class="grid grid-cols-10 p-0 border-token w-full xl:w-1/2 mx-auto">
	{#each regions as region}
		<div class="p-0 border-token">
			<a href="/admin/regions/{region.id}">
				{#each region.elevationMap as elevationRow, x}
					<div class="grid grid-cols-10 p-0">
						{#each elevationRow as elevationColumn, y}
							<div
								class="
									px-0 py-1.5 
									justify-center text-center items-center text-xs
									"
								style="
									background: rgb({elevationColumn * 255}, {elevationColumn * 255}, {elevationColumn * 255})
									"
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
