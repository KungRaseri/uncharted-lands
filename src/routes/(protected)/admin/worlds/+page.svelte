<script lang="ts">
	import type { PageData } from './$types';
	import { Table, tableMapperValues, type TableSource } from '@skeletonlabs/skeleton';

	import WebPlus from 'svelte-material-icons/WebPlus.svelte';
	import Web from 'svelte-material-icons/Web.svelte';

	export let data: PageData;

	let tableSimple: TableSource;

	if (data.worlds.length) {
		tableSimple = {
			head: Object.keys(data.worlds[0]),
			body: tableMapperValues(data.worlds, Object.keys(data.worlds[0])),
			meta: tableMapperValues(data.worlds, Object.keys(data.worlds[0])),
			foot: ['Total Worlds', data.worlds.length.toString()]
		};
	}

	function selectionHandler(e: any) {}
</script>

<div class="grid grid-cols-2 p-4">
	<h1>Worlds</h1>
	{#if data.worlds.length}
		<div class="text-right">
			<a href="worlds/create" class="btn btn-sm variant-soft-primary w-min rounded-md">
				<WebPlus size={24} />
				New World
			</a>
		</div>
	{/if}
</div>
<hr class="mx-2" />
<section class="p-4">
	{#if data.worlds.length}
		<Table source={tableSimple} interactive={true} on:selected={selectionHandler} />
	{:else}
		<div class="justify-center items-center text-center">
			<div class="mx-auto w-min">
				<Web size={48} />
			</div>
			<h3 class="mt-2 text-sm font-semibold text-token">No worlds</h3>
			<p class="mt-1 text-sm text-surface-500-400-token">Get started by creating a new world.</p>
			<div class="mt-6">
				<a href="worlds/create" class="btn btn-sm variant-soft-primary">
					<WebPlus size={24} />
					New World
				</a>
			</div>
		</div>
	{/if}
</section>
