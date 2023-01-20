<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	import Information from 'svelte-material-icons/Information.svelte';
	import WebPlus from 'svelte-material-icons/WebPlus.svelte';
	import ServerPlus from 'svelte-material-icons/ServerPlus.svelte';

	let isWorldFormActive = false;

	function handleCreateServer() {
		isWorldFormActive = true;
	}

	export let data: PageData;
</script>

<div class="m-5">
	<span class="float-left mr-5"><h1>Worlds</h1></span>
	<div class="w-full grid grid-cols-4">
		{#each data.tiles as tile}
			<div class="bg-slate-50 rounded-md m-2 w-1/4 sm:col-span-1 md:col-span-3">
				<div class="flex w-full items-center justify-between space-x-6 p-6">
					<div class="truncate">
						<div class="flex items-center space-x-3">
							<h3 class="truncate text-sm font-medium text-gray-900">{tile.id}</h3>
						</div>
						<p class="mt-1 truncate text-xs text-gray-500">{tile.regionId}</p>
					</div>
				</div>
				<h1>Regions</h1>
				<div class="w-full flex p-0 m-0">
					{#each tile.resources as resource, i}
						<a
							href="/admin/resources/{resource.id}"
							class="mx-1 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
							>{i}</a
						>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
