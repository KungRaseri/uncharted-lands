<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="m-1">
	<div class="bg-slate-200 rounded-md mx-1 my-5 p-0">
		<div class="px-6 py-2 w-full flex">
			<span class="text-xl">{data.tile.id}</span>
		</div>
		<div class="bg-slate-50 rounded-md mx-5 my-5 p-0">
			<div class="px-6 py-1 w-full">
				<hr />
				{#if !data.tile.settlementId}
					<p>None</p>
				{/if}

				{#if data.tile.settlementId}
					<div class="w-1/2">
						<span class="text-lg">{data.tile.Settlement?.name}</span>

						<div class="flex">
							<span class="bg-slate-300 rounded-full py-1 px-2 mx-1 w-fit">
								<span class="text-xs text-gray-500">ID: {data.tile.settlementId}</span>
							</span>
							<span class="bg-slate-300 rounded-full py-1 px-2 mx-1 w-fit">
								<span class="text-xs text-gray-500">
									Server Profile Data ID: {data.tile.Settlement?.profileServerDataProfileId}
								</span>
							</span>
						</div>
					</div>
				{/if}
				<hr />
				{#if !data.tile.Plots.length}
					<p>None</p>
				{/if}
				<div class="w-full flex p-0 m-0">
					{#each data.tile.Plots as plot, i}
						<a
							href="/admin/resources/{plot.id}"
							class="m-1 p-2 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
						>
							{plot.tileId} [{plot.settlementId}]
						</a>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
