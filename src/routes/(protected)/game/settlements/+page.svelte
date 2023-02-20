<script lang="ts">
	import type { PageData } from './$types';
	import { createDataTableStore, dataTableHandler, tableInteraction } from '@skeletonlabs/skeleton';

	export let data: PageData;

	let settlementsTableStore = createDataTableStore(data.settlements, {
		search: '',
		sort: '',
		pagination: {
			offset: 0,
			limit: 15,
			size: 0,
			amounts: [5, 15, 25]
		}
	});

	settlementsTableStore.subscribe((model) => dataTableHandler(model));

	$: settlementsTableStore.updateSource(data.settlements);
</script>

<div class="m-1">
	<h1 id="settlements-header">settlements</h1>
	<div class="table-container">
		<div class="p-0 m-3 w-11/12 flex space-x-3">
			<input
				bind:value={$settlementsTableStore.search}
				type="search"
				placeholder="Search..."
				class="input"
			/>
		</div>
		<table aria-describedby="settlements-header" class="table table-hover" use:tableInteraction>
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
				{#if $settlementsTableStore}
					{#each $settlementsTableStore.filtered as settlement, index}
						<tr>
							<td><a href="/game/settlements/{settlement.id}">{settlement.id}</a></td>
							<td>{settlement.name}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
