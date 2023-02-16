<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	import Edit from 'svelte-material-icons/TooltipEdit.svelte';
	import Information from 'svelte-material-icons/Information.svelte';
	import Close from 'svelte-material-icons/Close.svelte';

	export let data: PageData;
</script>

<div class="m-1">
	<div class="bg-slate-200 rounded-md mx-1 my-5 p-0">
		<div class="px-6 py-2 w-full flex">
			<span class="text-xl">{data.tile.id}</span>
		</div>
		<div class="bg-slate-50 rounded-md mx-5 my-5 p-0">
			<div class="px-6 py-1 w-full">
				<hr />
				{#if !data.tile.settlementId}
					<p>None</p>
				{/if}

				{#if data.tile.settlementId}
					<div class="w-1/2">
						<span class="text-lg">{data.tile.settlement?.name}</span>

						<div class="flex">
							<span class="bg-slate-300 rounded-full py-1 px-2 mx-1 w-fit">
								<span class="text-xs text-gray-500">ID: {data.tile.settlementId}</span>
							</span>
							<span class="bg-slate-300 rounded-full py-1 px-2 mx-1 w-fit">
								<span class="text-xs text-gray-500">
									Server Profile Data ID: {data.tile.settlement?.profileServerDataProfileId}
								</span>
							</span>
						</div>
					</div>
				{/if}
				<hr />
				{#if !data.tile.resources.length}
					<p>None</p>
				{/if}
				<div class="w-full flex p-0 m-0">
					{#each data.tile.resources as resource, i}
						<a
							href="/admin/resources/{resource.id}"
							class="m-1 p-2 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
						>
							{resource.resource} [{resource.value}]
						</a>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
