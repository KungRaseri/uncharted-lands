<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchTerm = $state('');
	
	let filteredPlots = $derived(data.plots.filter(plot => {
		if (!searchTerm) return true;
		const search = searchTerm.toLowerCase();
		return (
			plot.id.toLowerCase().includes(search) ||
			plot.tileId.toLowerCase().includes(search) ||
			(plot.Settlement?.id && plot.Settlement.id.toLowerCase().includes(search))
		);
	}));
</script>

<div class="m-1">
	<h1 id="plots-header">Plots</h1>
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
			<table aria-describedby="plots-header" class="table caption-bottom">
				<thead>
					<tr>
						<th>ID</th>
						<th>Settlement ID</th>
						<th>Tile ID</th>
						<th>Resources</th>
					</tr>
				</thead>
				<tbody class="[&>tr]:hover:preset-tonal-primary">
					{#each filteredPlots as plot}
						<tr>
							<td><a href="/admin/plots/{plot.id}">{plot.id}</a></td>
							<td>{plot.Settlement?.id}</td>
							<td>{plot.tileId}</td>
							<td>{plot.area}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
