<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	import Edit from 'svelte-material-icons/TooltipEdit.svelte';
	import Information from 'svelte-material-icons/Information.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import Home from 'svelte-material-icons/Home.svelte';

	import { getCSSFromTile } from '$lib/game/tile-helper';

	let isWorldFormActive = false;

	function toggleWorldForm() {
		isWorldFormActive = !isWorldFormActive;
	}

	function closeWorldForm() {
		isWorldFormActive = !isWorldFormActive;
	}

	export let data: PageData;
</script>

<div class="rounded-md">
	<hr class="!border-t-8 !border-double" />
	<div class="rounded-md">
		<div class="w-fit m-1 p-1">
			<button class="m-5">Regenerate</button>
		</div>
		<hr class="!border-t-8 !border-double" />
		{#if !data.world.regions.length}
			<p>None</p>
		{/if}
		<div class="grid grid-cols-10">
			{#each data.world.regions as region, i}
				<div class="grid grid-cols-10">
					{#each region.tiles as tile, j}
						<a class="block" href="/admin/tiles/{tile.id}">
							<div
								class="text-center rounded-none 
									p-1 py-3
									hover:bg-opacity-50
									bg-opacity-80
									{getCSSFromTile(tile.biome)?.bg}
									"
							>
								{#if tile.settlementId}
									<div class="relative -top-5 left-3 -m-2">
										<Home />
									</div>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>
