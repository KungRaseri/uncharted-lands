<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchTerm = $state('');
	
	let filteredTiles = $derived(data.tiles.filter(tile => {
		if (!searchTerm) return true;
		const search = searchTerm.toLowerCase();
		return (
			tile.id.toLowerCase().includes(search) ||
			tile.type.toLowerCase().includes(search)
		);
	}));
</script>

<div class="m-1">
	<h1 id="tiles-header">Tiles</h1>
	<div class="table-container">
		<div class="p-0 m-3 w-11/12 flex space-x-3">
			<input
				bind:value={searchTerm}
				type="search"
				placeholder="Search..."
				class="input"
			/>
		</div>
		<div class="table-wrap">
			<table aria-describedby="tiles-header" class="table caption-bottom">
				<thead>
					<tr>
						<th>ID</th>
						<th>Type</th>
						<th>Elevation</th>
						<th>Precipitation</th>
						<th>Temperature</th>
					</tr>
				</thead>
				<tbody class="[&>tr]:hover:preset-tonal-primary">
					{#each filteredTiles as tile}
						<tr>
							<td><a href="/admin/tiles/{tile.id}">{tile.id}</a></td>
							<td>{tile.type}</td>
							<td>{(tile.elevation * 100).toPrecision(3)}</td>
							<td>{tile.precipitation.toPrecision(3)}</td>
							<td>{tile.temperature.toPrecision(3)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
