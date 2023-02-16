<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	import WebPlus from 'svelte-material-icons/WebPlus.svelte';
	import Information from 'svelte-material-icons/Information.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import { slide } from 'svelte/transition';

	let isGenerateWorldFormActive = false;

	function toggleGenerateWorldForm() {
		isGenerateWorldFormActive = !isGenerateWorldFormActive;
	}

	function closeGenerateWorldForm() {
		isGenerateWorldFormActive = !isGenerateWorldFormActive;
	}

	let regionMax: number;
	let tilesPerRegion: number;

	export let data: PageData;
	export let form: ActionData;
</script>

<div class="m-0 p-0">
	<div class="rounded-md mx-1 my-5">
		<div class="px-6 py-2 w-full flex">
			<span class="text-xl">{data.server.name}</span>
			<span
				class="absolute right-0 py-0.5 px-2 mx-2 my-1 rounded-full text-xs font-medium 
				{data.server.status == 'ONLINE' ? 'bg-green-100  text-green-800' : 'bg-red-100  text-red-800'}"
			>
				{data.server.status}
			</span>
		</div>
		<div class="p-0 rounded-md mx-5 my-5">
			<div class="px-6 py-1 w-full">
				<div class="bg-slate-100 w-fit m-1 p-2">
					<button on:click={toggleGenerateWorldForm} class="w-fit">
						<span class="ml-1 mr-2"><WebPlus /></span>
						Generate World
					</button>
					{#if isGenerateWorldFormActive}
						<button on:click={closeGenerateWorldForm}><Close color="red" /></button>
					{/if}
				</div>
				{#if isGenerateWorldFormActive}
					<div class="grid grid-cols-3">
						<div class="col-span-1 m-1 p-3 shadow-md rounded-lg">
							<form
								action="?/generateWorld"
								method="POST"
								use:enhance={() => {
									return async ({ result }) => {
										invalidateAll();

										applyAction(result);
									};
								}}
							>
								<div class="space-y-3">
									<label for="regionMax">Max Regions</label>
									<input
										class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
										id="regionMax"
										type="number"
										min="1"
										max="100"
										value="1"
										name="regionMax"
										required
									/>

									<label for="tilesPerRegion">Tiles Per Region</label>
									<input
										class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
										id="tilesPerRegion"
										type="number"
										min="1"
										max="100"
										value="1"
										name="tilesPerRegion"
										required
									/>

									{#if form?.invalid}
										<div transition:slide>
											<div class="alert alert-error mx-5 mt-5">
												<div class="alert-message text-primary-50">
													<Information size={24} />
													<div class="grid grid-cols-1">Form information is invalid</div>
												</div>
											</div>
										</div>
									{/if}
								</div>
								<button class="my-5 px-3 py-2 bg-secondary-900 rounded-md">Preview</button>
								<button class="my-5 px-3 py-2 bg-primary-900 rounded-md">Submit</button>
							</form>
						</div>
						<div class="col-span-2 m-1 p-3 shadow-md rounded-lg">test</div>
					</div>
				{/if}

				<hr class="!border-t-8 !border-double" />

				{#if !data.server.worlds.length}
					<p class="m-1">None</p>
				{/if}
				<div class="w-full flex p-0 m-0 overflow-x-scroll">
					{#each data.server.worlds as world, i}
						<a
							href="/admin/worlds/{world.id}"
							class="m-1 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
						>
							{i}
						</a>
					{/each}
				</div>
			</div>
		</div>
		<div class="p-0 rounded-md mx-5 my-5">
			<div class="px-6 py-1 w-full">
				<hr class="!border-t-8 !border-double" />

				{#if !data.server.profileServerData.length}
					<p class="m-1">None</p>
				{/if}
				<div class="w-full flex p-0 m-0 overflow-x-scroll">
					{#each data.server.profileServerData as playerProfile, i}
						<a
							href="/admin/{playerProfile.profileId}"
							class="m-1 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
						>
							{i}
						</a>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
