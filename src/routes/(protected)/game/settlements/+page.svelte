<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;

	let searchTerm = '';
	
	$: filteredSettlements = data.settlements.filter(settlement => {
		if (!searchTerm) return true;
		const search = searchTerm.toLowerCase();
		return (
			settlement.id.toLowerCase().includes(search) ||
			settlement.name.toLowerCase().includes(search)
		);
	});
</script>

<div class="m-1">
	<h1 id="settlements-header">Settlements</h1>
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
			<table aria-describedby="settlements-header" class="table caption-bottom">
				<thead>
					<tr>
						<th>ID</th>
						<th>Name</th>
						<th>Resources</th>
					</tr>
				</thead>
				<tbody class="[&>tr]:hover:preset-tonal-primary">
					{#each filteredSettlements as settlement}
						<tr>
							<td><a href="/game/settlements/{settlement.id}">{settlement.id}</a></td>
							<td>{settlement.name}</td>
							<td>
								<div class="card w-fit">
									<section class="p-1">
										<span class="badge preset-outlined-surface-500">Food: {settlement.Storage.food}</span>
										<span class="badge preset-outlined-surface-500">Water: {settlement.Storage.water}</span>
										<span class="badge preset-outlined-surface-500">Wood: {settlement.Storage.wood}</span>
										<span class="badge preset-outlined-surface-500">Stone: {settlement.Storage.stone}</span>
										<span class="badge preset-outlined-surface-500">Ore: {settlement.Storage.ore}</span>	
									</section>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
