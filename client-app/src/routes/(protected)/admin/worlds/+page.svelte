<script lang="ts">
	import {
		ActionIcon,
		Alert,
		Box,
		Button,
		Grid,
		Group,
		Header,
		InputWrapper,
		Stack,
		Text,
		Title
	} from '@svelteuidev/core';
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

<Box class="m-5">
	<Box class="my-3 h-8">
		<Text class="float-left mr-5"><h1>Worlds</h1></Text>
		{#if data.worlds.length}
			<Group class="float-left h-10" position="left">
				<ActionIcon on:click={handleCreateServer}><ServerPlus size={24} height={24} /></ActionIcon>
			</Group>
		{/if}
	</Box>
	{#if !data.worlds.length && !isWorldFormActive}
		<Box class="w-1/3">
			<Button
				on:click={handleCreateServer}
				fullSize
				variant="subtle"
				class="relative block w-full h-full p-8 rounded-lg border-2 border-dashed border-gray-300 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:bg-transparent"
			>
				<Box class="mx-auto w-min"><ServerPlus color="silver" size={48} width={48} /></Box>
				<span class="mt-2 block text-sm font-medium text-slate-200">Create a new world</span>
			</Button>
		</Box>
	{/if}

	<Grid cols={3} class="w-full">
		{#each data.worlds as world}
			<Grid.Col xs={1} sm={1} md={3} lg={3} xl={3} class="bg-slate-50 rounded-md m-2 w-1/4">
				<div class="flex w-full items-center justify-between space-x-6 p-6">
					<div class="truncate">
						<div class="flex items-center space-x-3">
							<h3 class="truncate text-sm font-medium text-gray-900">{world.name}</h3>
							<span
								class="inline-block flex-shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
							>
								{world.status}
							</span>
						</div>
						<p class="mt-1 truncate text-sm text-gray-500">{world.id}</p>
					</div>
				</div>
				<Text>Worlds</Text>
				<ul class="grid mb-3">
					<ActionIcon href="/admin/worlds/{world.Server.id}" root="a"><WebPlus /></ActionIcon>
				</ul>
			</Grid.Col>
		{/each}
	</Grid>
</Box>
