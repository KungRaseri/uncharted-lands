<script lang="ts">
	import type { PageData } from './$types';
	import ElevationRise from 'svelte-material-icons/ElevationRise.svelte';
	import Earth from 'svelte-material-icons/Earth.svelte';
	import WeatherPouring from 'svelte-material-icons/WeatherPouring.svelte';
	import ThermometerLines from 'svelte-material-icons/ThermometerLines.svelte';

	export let data: PageData;
</script>

<ol class="breadcrumb">
	<li class="crumb"><a href="/admin/">Dashboard</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li class="crumb"><a href="/admin/regions/{data.tile.regionId}">Region</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li>Tile [{data.tile.id}]</li>
</ol>

<div class="card">
	<header class="card-header">
		<h2>{data.tile.id}</h2>
	</header>

	<section class="p-4">
		<div class="card">
			<header class="card-header"><h2>Details</h2></header>
			<section class="p-4">
				<ul class="list">
					<li class="list-item">
						<span><Earth size="24"/></span>
						<span class="flex-auto">Biome: {data.tile.Biome.name}</span>
					</li>
					<li class="list-item">
						<span><ElevationRise size={24} /></span>
						<span class="flex-auto">
							Elevation: {(data.tile.elevation * 10000).toPrecision(8)} ({data.tile.elevation})
						</span>
					</li>
					<li class="list-item">
						<span><WeatherPouring size={24} /></span>
						<span class="flex-auto">
							Precipitation: {data.tile.precipitation.toPrecision(5)} ({data.tile.precipitation})
						</span>
					</li>
					<li class="list-item">
						<span><ThermometerLines size={24} /></span>
						<span class="flex-auto">
							Temperature: {data.tile.temperature.toPrecision(4)} ({data.tile.temperature})
						</span>
					</li>
				</ul>
			</section>
		</div>
	</section>

	<footer class="px-6 py-1 w-full">
		<h2>Plots</h2>
		{#if !data.tile.Plots.length}
			<p>None</p>
		{/if}
		<div class="w-full flex p-0 m-0">
			{#each data.tile.Plots as plot, i}
				<a
					href="/admin/plots/{plot.id}"
					class="m-1 p-2 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
				>
					{plot.tileId}
				</a>
			{/each}
		</div>
	</footer>
</div>
