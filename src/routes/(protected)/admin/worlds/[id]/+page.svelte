<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="card p-4">
	<header class="card-header flex space-x-3">
		<h1 class="text-xl">{data.world.name}</h1>
	</header>

	<hr class="m-2" />

	<!-- regions -->
	<div class="p-4">
		<h2>Map</h2>
		{#if data.world.regions}
			<div class="grid grid-cols-10 p-0 border-token w-full xl:w-5/6 mx-auto">
				{#each data.world.regions as region}
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
		{/if}
	</div>
</div>
