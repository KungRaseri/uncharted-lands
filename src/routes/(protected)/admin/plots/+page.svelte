<script lang="ts">
	import type { PageData } from './$types';
	import { createDataTableStore, dataTableHandler, tableInteraction } from '@skeletonlabs/skeleton';

	export let data: PageData;

	let plotsTableStore = createDataTableStore(data.plots, {
		search: '',
		sort: '',
		pagination: {
			offset: 0,
			limit: 15,
			size: 0,
			amounts: [5, 15, 25]
		}
	});

	plotsTableStore.subscribe((model) => dataTableHandler(model));

	$: plotsTableStore.updateSource(data.plots);
</script>

<div class="m-1">
	<h1 id="plots-header">Plots</h1>
	<div class="table-container">
		<div class="p-0 m-3 w-11/12 flex space-x-3">
			<input
				bind:value={$plotsTableStore.search}
				type="search"
				placeholder="Search..."
				class="input"
			/>
		</div>
		<table aria-describedby="plots-header" class="table table-hover" use:tableInteraction>
			<thead>
				<tr>
					<th>ID</th>
					<th>Settlement ID</th>
					<th>Tile ID</th>
					<th>Resources</th>
				</tr>
			</thead>
			<tbody>
				{#if $plotsTableStore}
					{#each $plotsTableStore.filtered as plot, index}
						<tr>
							<td><a href="/admin/plots/{plot.id}">{plot.id}</a></td>
							<td>{plot.settlementId}</td>
							<td>{plot.tileId}</td>
							<td>{plot.resources}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
