<script lang="ts">
	import type { PageData } from './$types';
	import { Table, tableMapperValues, type TableSource } from '@skeletonlabs/skeleton';

	import { ServerCog } from 'lucide-svelte';

	export let data: PageData;

	let tableSimple: TableSource = {
		head: Object.keys(data.servers[0]),
		body: tableMapperValues(data.servers, Object.keys(data.servers[0])),
		meta: tableMapperValues(data.servers, [...Object.keys(data.servers[0]), 'position']),
		foot: ['Total Servers', data.servers.length.toString()]
	};

	let isServerFormActive: Boolean = false;

	function selectionHandler() {}
</script>

<div class="card w-4/5">
	<h1 class="card-header">Servers</h1>
	<section class="p-4">
		<Table source={tableSimple} interactive={true} on:selected={selectionHandler} />
	</section>
</div>
