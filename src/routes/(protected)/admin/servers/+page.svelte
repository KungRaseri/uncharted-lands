<script lang="ts">
	import { type Server } from '@prisma/client';
	import type { PageData } from './$types';
	import { Table, tableMapperValues, type TableSource } from '@skeletonlabs/skeleton';

	import ServerPlus from 'svelte-material-icons/ServerPlus.svelte';

	export let data: PageData;

	let tableSimple: TableSource;

	if (data.servers.length > 0) {
		tableSimple = {
			head: Object.keys(data.servers[0]),
			body: tableMapperValues(data.servers, Object.keys(data.servers[0])),
			meta: tableMapperValues(data.servers, Object.keys(data.servers[0])),
			foot: ['Total Servers', data.servers.length.toString()]
		};
	}

	function selectionHandler(e: any) {}
</script>

<div class="card m-5">
	<h1 class="card-header">Servers</h1>
	<section class="p-4">
		{#if data.servers.length > 0}
			<Table source={tableSimple} interactive={true} on:selected={selectionHandler} />
		{:else}
			<p>No Servers</p>
		{/if}
	</section>
</div>
