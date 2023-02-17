<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="m-5">
	<span class="float-left mr-5"><h1>Tiles</h1></span>
	<div class="w-full grid grid-cols-4">
		{#each data.tiles as tile}
			<div class="bg-slate-50 rounded-md m-2 w-1/4 sm:col-span-1 md:col-span-3">
				<div class="flex w-full items-center justify-between space-x-6 p-6">
					<div class="truncate">
						<div class="flex items-center space-x-3">
							<h3 class="truncate text-sm font-medium text-gray-900">{tile.id}</h3>
						</div>
						<p class="mt-1 truncate text-xs text-gray-500">{tile.regionId}</p>
					</div>
				</div>
				<h1>Plots</h1>
				<div class="w-full flex p-0 m-0">
					{#each tile.Plots as plot, i}
						<a
							href="/admin/plots/{plot.id}"
							class="mx-1 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
							>{i}</a
						>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
