<script lang="ts">
	import type { Region } from '@prisma/client';

	export let map: Region[];
</script>

<div class="grid grid-cols-10 p-0 border-token w-full xl:w-5/6 mx-auto">
	{#each map as region}
		<div class="p-0 border-token">
			{#each region.elevationMap as elevationRow}
				<div class="grid grid-cols-10 p-0">
					{#each elevationRow as elevationColumn}
						<div
							class="px-0 py-2.5 justify-center text-center items-center"
							style="background: 
									rgb({elevationColumn * 255}, {elevationColumn * 255}, {elevationColumn * 255})"
						>
							<!-- {j},{k} -->
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{/each}
</div>
