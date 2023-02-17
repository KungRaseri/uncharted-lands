<script lang="ts">
	import type { ActionData, PageData } from './$types';

	import Campfire from 'svelte-material-icons/Campfire.svelte';

	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let selectedServer: string, selectedWorld: string, username: string;
	export let data: PageData;
</script>

<div class="bg-surface-700 mt-10 p-5 w-full md:w-1/2 mx-auto">
	<form
		action="?/settle"
		method="POST"
		use:enhance={() => {
			return async ({ result }) => {
				invalidateAll();

				applyAction(result);
			};
		}}
	>
		<div class="space-y-6">
			<div>
				<h3 class="text-lg font-medium leading-6">Choose Server and World</h3>
				<p class="mt-1 text-sm">Let's choose the server and world you'd like to start in.</p>
			</div>

			<div class="flex text-center">
				<div class="flex-row">
					<select id="server" name="server" class="rounded-md" bind:value={selectedServer}>
						{#each data.servers as server}
							<option value={server.id}>{server.name}</option>
						{/each}
					</select>
				</div>
				<div class="flex-row">
					<select id="world" name="world" class="rounded-md" bind:value={selectedWorld}>
						{#each data.worlds.filter((w) => w.serverId === selectedServer) as world, i}
							<option value={world.id}>World {i}</option>
						{/each}
					</select>
				</div>
				<div class="mx-1 py-3 text-xs">
					{selectedServer ?? ''}
				</div>
				<div class="mx-1 py-3 text-xs">
					{selectedWorld ?? ''}
				</div>
			</div>
			<div>
				<h3 class="text-lg font-medium leading-6">Choose Username</h3>
			</div>

			<div class="mt-6 gap-y-6 gap-x-4 sm:grid-cols-6">
				<input id="username" type="text" name="username" bind:value={username} />
			</div>
		</div>

		<div class="pt-5">
			<div class="flex justify-end">
				<button
					disabled={!selectedWorld || !username}
					type="submit"
					class="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
				>
					<div class="mx-1 my-0.5">
						<Campfire />
					</div>
					Settle in this World
				</button>
			</div>
		</div>
	</form>
</div>
