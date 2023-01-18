<script lang="ts">
	import {
		ActionIcon,
		Alert,
		Anchor,
		Box,
		Button,
		Card,
		Container,
		Divider,
		Grid,
		Group,
		Header,
		InputWrapper,
		SimpleGrid,
		Stack,
		Text,
		Title
	} from '@svelteuidev/core';
	import type { ActionData, PageData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	import Information from 'svelte-material-icons/Information.svelte';
	import Close from 'svelte-material-icons/Close.svelte';
	import WebPlus from 'svelte-material-icons/WebPlus.svelte';
	import ServerPlus from 'svelte-material-icons/ServerPlus.svelte';
	import World from '$lib/components/game/map/World.svelte';

	let isServerFormActive: Boolean = false;

	function toggleServerForm() {
		isServerFormActive = !isServerFormActive;
	}

	function closeServerForm() {
		isServerFormActive = !isServerFormActive;
	}

	export let data: PageData;
	export let form: ActionData;
</script>

<Box class="m-5">
	<Box class="my-3 h-8">
		<Text class="float-left mr-5 text-slate-50"><h1>Servers</h1></Text>
		{#if data.servers.length}
			<Group class="float-left h-10">
				<ActionIcon class="text-slate-50 hover:text-slate-700" on:click={toggleServerForm}>
					<ServerPlus size={24} height={24} />
				</ActionIcon>
				{#if isServerFormActive}
					<ActionIcon class="text-red-500 hover:text-slate-700" on:click={closeServerForm}>
						<Close size={24} height={24} />
					</ActionIcon>
				{/if}
			</Group>
		{/if}
	</Box>
	{#if !data.servers.length && !isServerFormActive}
		<Box class="w-1/3">
			<Button
				on:click={toggleServerForm}
				fullSize
				variant="subtle"
				class="relative block w-full h-full p-8 rounded-lg border-2 border-dashed border-gray-300 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 hover:bg-transparent"
			>
				<Box class="mx-auto w-min"><ServerPlus color="silver" size={48} width={48} /></Box>
				<span class="mt-2 block text-sm font-medium text-slate-200">Create a new server</span>
			</Button>
		</Box>
	{/if}

	{#if isServerFormActive}
		<Box class="w-1/2 m-5 p-5 shadow-sm bg-slate-500 rounded-lg">
			<form
				action="?/create"
				method="POST"
				use:enhance={() => {
					return async ({ result }) => {
						invalidateAll();

						applyAction(result);
					};
				}}
			>
				<Stack>
					<InputWrapper label="Name" required>
						<input
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							id="name"
							type="text"
							name="name"
							required
						/>
					</InputWrapper>

					<InputWrapper label="Hostname" required>
						<input
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							id="Hostname"
							type="text"
							name="hostname"
							required
						/>
					</InputWrapper>

					<InputWrapper label="Port" required>
						<input
							class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
							id="port"
							type="text"
							name="port"
							required
						/>
					</InputWrapper>

					{#if form?.invalid}
						<Alert icon={Information} title="Error">Form information is invalid</Alert>
					{/if}
					{#if form?.exists}
						<Alert icon={Information} title="Error">Server exists.</Alert>
					{/if}
					<Button variant="default">Submit</Button>
				</Stack>
			</form>
		</Box>
	{/if}
	<SimpleGrid cols={4}>
		{#each data.servers as server}
			<a href="/admin/servers/{server.id}">
				<Card p={0} class="bg-slate-200 rounded-md py-2 px-1 hover:shadow-xl hover:bg-slate-50">
					<Card.Section class="px-6 py-2 w-full">
						{server.name}
						<span
							class="absolute right-8 py-0.5 px-2 mx-2 my-1 rounded-full text-xs font-medium 
							{server.status == 'ONLINE' ? 'bg-green-100  text-green-800' : 'bg-red-100  text-red-800'}"
						>
							{server.status}
						</span>
					</Card.Section>

					<Card.Section class="px-6 py-1 w-full">
						<Divider size="lg" label="Worlds" labelPosition="left" />
						{#if !server.worlds.length}
							<p>None</p>
						{/if}
						<Container class="w-full flex p-0 m-0">
							{#each server.worlds as world, i}
								<Box class="mx-1 px-5 py-4 text-xs rounded-full bg-slate-600">
									<Text class="text-slate-300">{i}</Text>
								</Box>
							{/each}
						</Container>
					</Card.Section>

					<Card.Section class="px-6 py-1 w-full">
						<Divider size="lg" label="Players" labelPosition="left" />
						{#if !server.profileServerData.length}
							<p>None</p>
						{/if}
						{#each server.profileServerData as playerProfile}
							<li class="col-span-1 divide-y divide-gray-200 rounded-lg bg-white" />
						{/each}
					</Card.Section>
				</Card>
			</a>
		{/each}
	</SimpleGrid>
</Box>
