<script lang="ts">
	import type { PageData } from './$types';
	import { Table, tableMapperValues, type TableSource } from '@skeletonlabs/skeleton';

	import ServerPlus from 'svelte-material-icons/ServerPlus.svelte';

	import { goto } from '$app/navigation';

	export let data: PageData;

	let tableSimple: TableSource;

	if (data.settlements.length) {
		const filteredKeys = Object.keys(data.settlements[0]).filter(
			(key) =>
				key !== 'playerProfileId' && key !== 'plotId' && key !== 'createdAt' && key !== 'updatedAt'
		);
		tableSimple = {
			head: filteredKeys,
			body: tableMapperValues(data.settlements, filteredKeys),
			meta: tableMapperValues(data.settlements, filteredKeys),
			foot: ['Total Settlements', data.settlements.length.toString()]
		};
	}

	function selectionHandler(e: any) {
		console.log('event:select', e);

		goto(`/game/settlements/${e.detail[0]}`);
	}
</script>

<section class="p-3">
	<Table
		source={tableSimple}
		interactive={true}
		on:selected={selectionHandler}
		regionBody="hover:bg-primary-50-900-token hover:cursor-pointer"
	/>
</section>
