<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<ol class="breadcrumb">
	<li class="crumb"><a href="/admin/">Dashboard</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li class="crumb"><a href="/admin/worlds/{data.region.worldId}/">World</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li>{data.region.name} [{data.region.id}]</li>
</ol>

<div class="card p-4">
	<div class="px-6 py-2">
		<h2>{data.region.name}</h2>
		<span class="text-xl">{`<${data.region.id}>`}</span>
	</div>
	<hr class="my-2" />
	<div class="w-full">
		{#if !data.region.tiles.length}
			<p>None</p>
		{/if}
		<div class="w-full p-0 m-0 grid grid-cols-10">
			{#each data.region.tiles as tile, i}
				<div class="card p-0 w-1/10 h-full rounded-none">
					<header class="card-header">
						<a href="/admin/tiles/{tile.id}" class="">
							{tile.id.substring(0, 8)}
						</a>
					</header>
					<div class="p-4 grid grid-cols-1 text-xs">
						<span>{tile.type}</span>
						<span>E: {(tile.elevation * 100).toPrecision(3)}</span>
						<span>P: {tile.precipitation.toPrecision(3)}</span>
						<span>T: {tile.temperature.toPrecision(3)}</span>
						<span>{tile.Biome.name.substring(0, 9)}...</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
