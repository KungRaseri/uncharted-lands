<script lang="ts">
	import type { PageData } from './$types';

	import { Globe } from 'lucide-svelte';

	export let data: PageData;

	let searchTerm = '';
	
	$: filteredWorlds = data.worlds.filter(world => {
		if (!searchTerm) return true;
		const search = searchTerm.toLowerCase();
		return (
			world.id.toLowerCase().includes(search) ||
			world.name.toLowerCase().includes(search) ||
			world.server.name.toLowerCase().includes(search)
		);
	});
</script>

<div class="m-1">
	<h1 id="worlds-header">Worlds</h1>
	<div class="table-container">
		<div class="p-0 m-3 w-11/12 flex space-x-3">
			<input
				bind:value={searchTerm}
				type="search"
				placeholder="Search..."
				class="input"
			/>
			<a href="/admin/worlds/create" class="btn preset-filled-primary-500">
				<span class="mx-1 px-0 py-3 "><Globe /></span>
				<span class="mx-1 px-0 py-2 ">Create</span>
			</a>
		</div>
		<div class="table-wrap">
			<table aria-describedby="worlds-header" class="table caption-bottom">
				<thead>
					<tr>
						<th><input type="checkbox" id="select-all" name="select-all" /></th>
						<th>ID</th>
						<th>World Name</th>
						<th>Server {`<ID>`}</th>
						<th>Regions</th>
					</tr>
				</thead>
				<tbody class="[&>tr]:hover:preset-tonal-primary">
					{#each filteredWorlds as world}
						<tr>
							<td><input type="checkbox" /></td>
							<td><a href="/admin/worlds/{world.id}">{world.id}</a></td>
							<td>{world.name}</td>
							<td>{`${world.server.name} <${world.serverId}>`}</td>
							<td>{world.regions.length}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
