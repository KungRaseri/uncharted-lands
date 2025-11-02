<script lang="ts">
	import type { PageData } from './$types';
	import TileDetails from '$lib/components/admin/TileDetails.svelte';
	import SettlementDetails from '$lib/components/admin/SettlementDetails.svelte';

	export let data: PageData;
</script>

<ol class="breadcrumb">
	<li class="crumb"><a href="/admin/">Dashboard</a></li>
	<li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
	<li class="crumb"><a href="/admin/tiles/{data.plot.tileId}">Tile</a></li>
	<li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
	<li>Plot [{data.plot.id}]</li>
</ol>

<div class="card">
	<header class="card-header">
		<h2>{data.plot.id}</h2>
	</header>

	<section class="p-4 grid grid-cols-1 space-y-2">
		<TileDetails tile={data.plot.Tile} />
		{#if data.plot.Settlement}
			<SettlementDetails settlement={data.plot.Settlement} />
		{:else}
			<div class="card">
				<section class="p-4">
					<h3>No Settlement Found</h3>
				</section>
			</div>
		{/if}
	</section>
	<section class="px-6 py-1 w-full">
		<div class="w-full p-0 m-0">
			<h3>Attributes</h3>

			<div class="card m-0 p-3">
				<div class="">
					<span class="badge preset-filled-secondary-500">
						Area: {data.plot.area}
					</span>
					<span class="badge preset-filled-secondary-500">
						Solar: {data.plot.solar}
					</span>
					<span class="badge preset-filled-secondary-500">
						Wind: {data.plot.wind}
					</span>
					<span class="badge preset-filled-secondary-500">
						Food: {data.plot.food}
					</span>
					<span class="badge preset-filled-secondary-500">
						Water: {data.plot.water}
					</span>
					<span class="badge preset-filled-secondary-500">
						Wood: {data.plot.wood}
					</span>
					<span class="badge preset-filled-secondary-500">
						Stone: {data.plot.stone}
					</span>
					<span class="badge preset-filled-secondary-500">
						Ore: {data.plot.ore}
					</span>
				</div>
			</div>
		</div>
	</section>
</div>
