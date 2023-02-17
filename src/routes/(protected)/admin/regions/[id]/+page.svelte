<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="m-1">
	<div class="bg-slate-200 rounded-md mx-1 my-5 p-0">
		<div class="px-6 py-2 w-full flex">
			<span class="text-xl">{data.region.id}</span>
			<span
				class="absolute right-0 py-0.5 px-2 mx-2 my-1 rounded-full text-xs font-medium 
				{data.region.world.server.status == 'ONLINE'
					? 'bg-green-100  text-green-800'
					: 'bg-red-100  text-red-800'}"
			>
				{data.region.world.server.status}
			</span>
		</div>
		<div class="bg-slate-50 rounded-md mx-5 my-5 p-0">
			<div class="px-6 py-1 w-full">
				<hr />
				{#if !data.region.tiles.length}
					<p>None</p>
				{/if}
				<div class="w-full p-0 m-0 grid grid-cols-10">
					{#each data.region.tiles as tile, i}
						<a
							href="/admin/tiles/{tile.id}"
							class="m-1 py-10 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
						>
							{tile.biomeId}
						</a>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
