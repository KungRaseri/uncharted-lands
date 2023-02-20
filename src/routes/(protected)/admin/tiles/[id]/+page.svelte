<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<ol class="breadcrumb">
	<li class="crumb"><a href="/admin/">Dashboard</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li class="crumb"><a href="/admin/regions/{data.tile.regionId}">Region</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li>Tile [{data.tile.id}]</li>
</ol>

<div class="card p-4">
	<header class="card-header">
		<h2>{data.tile.id}</h2>
	</header>

	<div class="px-6 py-1 w-full">
		{#if !data.tile.Plots.length}
			<p>None</p>
		{/if}
		<div class="w-full flex p-0 m-0">
			{#each data.tile.Plots as plot, i}
				<a
					href="/admin/plots/{plot.id}"
					class="m-1 p-2 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
				>
					{plot.tileId} [{plot.settlementId}]
				</a>
			{/each}
		</div>
	</div>
</div>
