<script lang="ts">
	import {
		ActionIcon,
		Alert,
		Box,
		Button,
		Container,
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
	<Text class="float-left mr-5"><h1>Worlds</h1></Text>
	<Grid cols={4} class="w-full">
		{#each data.tiles as tile}
			<Grid.Col xs={1} sm={1} md={3} lg={3} xl={3} class="bg-slate-50 rounded-md m-2 w-1/4">
				<div class="flex w-full items-center justify-between space-x-6 p-6">
					<div class="truncate">
						<div class="flex items-center space-x-3">
							<h3 class="truncate text-sm font-medium text-gray-900">{tile.id}</h3>
						</div>
						<p class="mt-1 truncate text-xs text-gray-500">{tile.regionId}</p>
					</div>
				</div>
				<Text>Regions</Text>
				<Container class="w-full flex p-0 m-0">
					{#each tile.resources as resource, i}
						<Button
							href="/admin/resources/{resource.id}"
							class="mx-1 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
							>{i}</Button
						>
					{/each}
				</Container>
			</Grid.Col>
		{/each}
	</Grid>
</Box>
