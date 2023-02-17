<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="m-5">
	<span class="mr-5"><h1>Regions</h1></span>
	<div class="w-full grid grid-cols-10">
		{#each data.regions as region}
			<div class="bg-slate-50 rounded-md m-2 w-1/4 sm:col-span-1 md:col-span-3">
				<div class="flex w-full items-center justify-between space-x-6 p-6">
					<div class="truncate">
						<div class="flex items-center space-x-3">
							<h3 class="truncate text-sm font-medium text-gray-900">{region.id}</h3>
							<span
								class="inline-block flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {region
									.world.server.status == 'ONLINE'
									? 'bg-green-100  text-green-800'
									: 'bg-red-100  text-red-800'}"
							>
								{region.world.server.status}
							</span>
						</div>
						<p class="mt-1 truncate text-xs text-gray-500">{region.world.server.id}</p>
					</div>
				</div>
				<h1>Tiles</h1>
				<div class="w-full flex p-0 m-0">
					{#each region.tiles as tile, i}
						<a
							href="/admin/regions/{tile.id}"
							class="mx-1 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
							>{i}</a
						>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
