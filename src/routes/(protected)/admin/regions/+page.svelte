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
	<span class="mr-5"><h1>Worlds</h1></span>
	<div class="w-full grid grid-cols-10">
		{#each data.worlds as world}
			<div class="bg-slate-50 rounded-md m-2 w-1/4 sm:col-span-1 md:col-span-3">
				<div class="flex w-full items-center justify-between space-x-6 p-6">
					<div class="truncate">
						<div class="flex items-center space-x-3">
							<h3 class="truncate text-sm font-medium text-gray-900">{world.id}</h3>
							<span
								class="inline-block flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {world
									.Server.status == 'ONLINE'
									? 'bg-green-100  text-green-800'
									: 'bg-red-100  text-red-800'}"
							>
								{world.Server.status}
							</span>
						</div>
						<p class="mt-1 truncate text-xs text-gray-500">{world.serverId}</p>
					</div>
				</div>
				<h1>Regions</h1>
				<div class="w-full flex p-0 m-0">
					{#each world.regions as region, i}
						<a
							href="/admin/regions/{region.id}"
							class="mx-1 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
							>{i}</a
						>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</div>
