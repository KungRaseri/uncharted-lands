<script lang="ts">
	import type { PageData } from './$types';
	import TileDetails from '$lib/components/admin/TileDetails.svelte';
	import SettlementDetails from '$lib/components/admin/SettlementDetails.svelte';

	export let data: PageData;
</script>

<ol class="breadcrumb">
	<li class="crumb"><a href="/admin/">Dashboard</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li class="crumb"><a href="/admin/tiles/{data.plot.tileId}">Tile</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
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
					<span class="badge bg-secondary-700-200-token text-secondary-200-700-token">
						Area: {data.plot.area}
					</span>
					<span class="badge bg-secondary-700-200-token text-secondary-200-700-token">
						Solar: {data.plot.solar}
					</span>
					<span class="badge bg-secondary-700-200-token text-secondary-200-700-token">
						Wind: {data.plot.wind}
					</span>
					<span class="badge bg-secondary-700-200-token text-secondary-200-700-token">
						Food: {data.plot.food}
					</span>
					<span class="badge bg-secondary-700-200-token text-secondary-200-700-token">
						Water: {data.plot.water}
					</span>
					<span class="badge bg-secondary-700-200-token text-secondary-200-700-token">
						Wood: {data.plot.wood}
					</span>
					<span class="badge bg-secondary-700-200-token text-secondary-200-700-token">
						Stone: {data.plot.stone}
					</span>
					<span class="badge bg-secondary-700-200-token text-secondary-200-700-token">
						Ore: {data.plot.ore}
					</span>
				</div>
			</div>
		</div>
	</section>
</div>
