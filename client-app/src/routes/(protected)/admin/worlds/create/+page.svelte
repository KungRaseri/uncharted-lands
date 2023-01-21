<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Archer from '$lib/components/game/entities/Archer.svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	$: console.log(form?.map);
	$: data;
</script>

<div class="mx-auto p-5 w-full">
	<div class="mx-auto p-5 my-5 bg-surface-700 rounded-md">
		<h1 class="">New World</h1>
		<form
			action="?/createWorld"
			method="POST"
			use:enhance={() => {
				return async ({ result }) => {
					invalidateAll();

					applyAction(result);
				};
			}}
		>
			<button class="">Generate</button>
		</form>

		{#if form?.map}
			<div class="flex w-full h-full">
				{#each form?.map as chunk, x}
					<div class="flex-row m-0 p-0">
						{#each chunk as tile, y}
							<div
								class="block w-min p-1 m-0"
								style="background: rgb({tile * 255},{tile * 255},{tile * 255})"
							/>
						{/each}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
