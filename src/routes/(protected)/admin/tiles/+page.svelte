<script lang="ts">
	import type { PageData } from './$types';
	import { createDataTableStore, dataTableHandler, tableInteraction } from '@skeletonlabs/skeleton';

	export let data: PageData;

	let tilesTableStore = createDataTableStore(data.tiles, {
		search: '',
		sort: '',
		pagination: {
			offset: 0,
			limit: 15,
			size: 0,
			amounts: [5, 15, 25]
		}
	});

	tilesTableStore.subscribe((model) => dataTableHandler(model));

	$: tilesTableStore.updateSource(data.tiles);
</script>

<div class="m-1">
	<h1 id="tiles-header">Tiles</h1>
	<div class="table-container">
		<div class="p-0 m-3 w-11/12 flex space-x-3">
			<input
				bind:value={$tilesTableStore.search}
				type="search"
				placeholder="Search..."
				class="input"
			/>
		</div>
		<table aria-describedby="tiles-header" class="table table-hover" use:tableInteraction>
			<thead>
				<tr>
					<th>ID</th>
					<th>Type</th>
					<th>Elevation</th>
					<th>Precipitation</th>
					<th>Temperature</th>
				</tr>
			</thead>
			<tbody>
				{#if $tilesTableStore}
					{#each $tilesTableStore.filtered as tile, index}
						<tr>
							<td><a href="/admin/tiles/{tile.id}">{tile.id}</a></td>
							<td>{tile.type}</td>
							<td>{(tile.elevation * 100).toPrecision(3)}</td>
							<td>{tile.precipitation.toPrecision(3)}</td>
							<td>{tile.temperature.toPrecision(3)}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
