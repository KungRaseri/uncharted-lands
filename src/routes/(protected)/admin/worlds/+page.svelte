<script lang="ts">
	import type { PageData } from './$types';
	import { createDataTableStore, dataTableHandler, tableInteraction } from '@skeletonlabs/skeleton';

	import WebPlus from 'svelte-material-icons/WebPlus.svelte';

	export let data: PageData;

	let worldsTableStore = createDataTableStore(data.worlds, {
		search: '',
		sort: '',
		pagination: {
			offset: 0,
			limit: 5,
			size: 0,
			amounts: [1, 2, 5, 10]
		}
	});

	worldsTableStore.subscribe((model) => dataTableHandler(model));
</script>

<div class="m-1">
	<h1 id="worlds-header">Worlds</h1>
	<div class="table-container">
		<div class="p-0 m-3 w-11/12 flex space-x-3">
			<input
				bind:value={$worldsTableStore.search}
				type="search"
				placeholder="Search..."
				class="input"
			/>
			<a href="/admin/worlds/create" class="btn bg-primary-400-500-token">
				<span class="mx-1 px-0 py-3 text-token"><WebPlus /></span>
				<span class="mx-1 px-0 py-2 text-token">Create</span>
			</a>
		</div>
		<table aria-describedby="worlds-header" class="table table-hover" use:tableInteraction>
			<thead>
				<tr>
					<th><input type="checkbox" id="select-all" name="select-all" /></th>
					<th>ID</th>
					<th>World Name</th>
					<th>Server {`<ID>`}</th>
					<th>Regions</th>
				</tr>
			</thead>
			<tbody>
				{#if $worldsTableStore}
					{#each $worldsTableStore.filtered as world, index}
						<tr>
							<td><input type="checkbox" /></td>
							<td><a href="/admin/worlds/{world.id}">{world.id}</a></td>
							<td>{world.name}</td>
							<td>{`${world.server.name} <${world.serverId}>`}</td>
							<td>{world.regions.length}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
