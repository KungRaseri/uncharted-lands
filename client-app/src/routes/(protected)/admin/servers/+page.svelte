<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { slide } from 'svelte/transition';
	import { onMount } from 'svelte';
	import {
		createDataTableStore,
		dataTableHandler,
		tableInteraction,
		type DataTableModel
	} from '@skeletonlabs/skeleton';

	import Information from 'svelte-material-icons/Information.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import WebPlus from 'svelte-material-icons/WebPlus.svelte';
	import ServerPlus from 'svelte-material-icons/ServerPlus.svelte';
	import type { Server } from '@sveltejs/kit';

	export let data: PageData;
	export let form: ActionData;

	let serversTableStore = createDataTableStore(data.servers, {
		search: '',
		sort: '',
		pagination: {
			offset: 0,
			limit: 15,
			size: 0,
			amounts: [5, 15, 25]
		}
	});

	serversTableStore.subscribe((model) => dataTableHandler(model));

	let isServerFormActive: Boolean = false;

	function toggleServerForm() {
		isServerFormActive = !isServerFormActive;
	}

	function closeServerForm() {
		isServerFormActive = !isServerFormActive;
	}

	$: serversTableStore.updateSource(data.servers);
</script>

<div class="m-1">
	<h1 id="servers-header">Servers</h1>
	<div class="table-container">
		<div class="p-0 m-3 w-11/12 flex space-x-3">
			<input bind:value={$serversTableStore.search} type="search" placeholder="Search..." />
			<a href="/admin/servers/create" class="btn bg-primary-400-500-token">
				<span class="mx-1 px-0 py-3 text-token"><ServerPlus /></span>
				<span class="mx-1 px-0 py-2 text-token">Create</span>
			</a>
		</div>
		<table aria-describedby="servers-header" class="table table-hover" use:tableInteraction>
			<thead>
				<tr>
					<th>ID</th>
					<th>Name</th>
					<th>Hostname</th>
					<th>Port</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#if $serversTableStore}
					{#each $serversTableStore.filtered as server, index}
						<tr>
							<td>{server.id}</td>
							<td>{server.name}</td>
							<td>{server.hostname}</td>
							<td>{server.port}</td>
							<td>{server.status}</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
