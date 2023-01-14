<script lang="ts">
	import { Box, Container, Text, Timeline, Title } from '@svelteuidev/core';
	import type { ActionData, PageData } from './$types';

	import LightningBoltCircle from 'svelte-material-icons/LightningBoltCircle.svelte';
	import Commit from 'svelte-material-icons/SourceCommit.svelte';
	import GithubLogo from 'svelte-material-icons/Github.svelte';
	import Campfire from 'svelte-material-icons/Campfire.svelte';
	import World from '$lib/components/game/map/World.svelte';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let selectedServer: string, selectedWorld: string, username: string;
	export let data: PageData;
	export let form: ActionData;
</script>

<Container class="bg-slate-300 p-5">
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
		<div class="space-y-8 divide-y divide-gray-200">
			<div>
				<div>
					<h3 class="text-lg font-medium leading-6 text-gray-900">Choose Server and World</h3>
					<p class="mt-1 text-sm text-gray-500">
						Let's choose the server and world you'd like to start in.
					</p>
				</div>

				<div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
					<div class="sm:col-span-1">
						<select id="server" name="server" class="rounded-md" bind:value={selectedServer}>
							{#each data.servers as server}
								<option value={server.id}>{server.name}</option>
							{/each}
						</select>
					</div>
					<div class="sm:col-span-1">
						<select id="world" name="world" class="rounded-md" bind:value={selectedWorld}>
							{#each data.worlds.filter((w) => w.serverId === selectedServer) as world, i}
								<option value={world.id}>World {i}</option>
							{/each}
						</select>
					</div>
					<div class="sm:col-span-1">
						{selectedServer ?? ''}
					</div>
					<div class="sm:col-span-1">
						{selectedWorld ?? ''}
					</div>
				</div>
			</div>
		</div>
		<div class="space-y-8 divide-y divide-gray-200">
			<div>
				<div>
					<h3 class="text-lg font-medium leading-6 text-gray-900">Choose Username</h3>
				</div>

				<div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
					<div class="sm:col-span-2">
						<input id="username" type="text" name="username" bind:value={username} />
					</div>
				</div>
			</div>
		</div>

		<div class="pt-5">
			<div class="flex justify-end">
				<button
					disabled={!selectedWorld || !username}
					type="submit"
					class="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
				>
					<Box class="mx-1 my-0.5"><Campfire /></Box> Settle in this World
				</button>
			</div>
		</div>
	</form>
</Container>
