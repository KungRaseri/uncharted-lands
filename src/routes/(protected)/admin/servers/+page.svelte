<script lang="ts">
	import { type Server } from '@prisma/client';
	import type { PageData } from './$types';
	import { Table, tableMapperValues, type TableSource } from '@skeletonlabs/skeleton';

	import ServerPlus from 'svelte-material-icons/ServerPlus.svelte';
	import ServerNetwork from 'svelte-material-icons/ServerNetwork.svelte';

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

<div class="grid grid-cols-2 p-4">
	<h1>Servers</h1>
	<div class="text-right">
		<a href="servers/create" class="btn btn-sm variant-soft-primary w-min rounded-md">
			<ServerPlus size={24} />
			New Server
		</a>
	</div>
</div>
<hr class="mx-2" />
<section class="p-4">
	{#if data.servers.length > 0}
		<Table source={tableSimple} interactive={true} on:selected={selectionHandler} />
	{:else}
		<div class="justify-center items-center text-center">
			<div class="mx-auto w-min">
				<ServerNetwork size={48} />
			</div>
			<h3 class="mt-2 text-sm font-semibold text-token">No servers</h3>
			<p class="mt-1 text-sm text-surface-500-400-token">Get started by creating a new server.</p>
			<div class="mt-6">
				<a href="servers/create" class="btn btn-sm variant-soft-primary">
					<ServerPlus size={24} />
					New Server
				</a>
			</div>
		</div>
	{/if}
</section>
