<script lang="ts">
	import {
		ActionIcon,
		Alert,
		Box,
		Button,
		Card,
		Container,
		Divider,
		Group,
		InputWrapper,
		Stack,
		Text,
		Title
	} from '@svelteuidev/core';
	import type { ActionData, PageData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	import WebPlus from 'svelte-material-icons/WebPlus.svelte';
	import Information from 'svelte-material-icons/Information.svelte';
	import Close from 'svelte-material-icons/Close.svelte';

	let isGenerateWorldFormActive = false;

	function toggleGenerateWorldForm() {
		isGenerateWorldFormActive = !isGenerateWorldFormActive;
	}

	function closeGenerateWorldForm() {
		isGenerateWorldFormActive = !isGenerateWorldFormActive;
	}

	export let data: PageData;
	export let form: ActionData;
</script>

<Box class="m-1">
	<Card p={0} class="bg-slate-200 rounded-md mx-1 my-5">
		<Card.Section class="px-6 py-2 w-full flex">
			<Text class="text-xl">{data.server.name}</Text>
			<span
				class="absolute right-0 py-0.5 px-2 mx-2 my-1 rounded-full text-xs font-medium 
				{data.server.status == 'ONLINE' ? 'bg-green-100  text-green-800' : 'bg-red-100  text-red-800'}"
			>
				{data.server.status}
			</span>
		</Card.Section>
		<Card p={0} class="bg-slate-50 rounded-md mx-5 my-5 p-1">
			<Card.Section class="px-6 py-1 w-full">
				<Group class="m-1">
					<Button on:click={toggleGenerateWorldForm} compact class="w-fit">
						<span class="ml-1 mr-2"><WebPlus /></span>Generate World
					</Button>
					{#if isGenerateWorldFormActive}
						<ActionIcon on:click={closeGenerateWorldForm}><Close color="red" /></ActionIcon>
					{/if}
				</Group>
				{#if isGenerateWorldFormActive}
					<Box class="w-1/2 m-3 p-3 shadow-md rounded-lg">
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
							<Stack>
								<InputWrapper
									label="Max Regions"
									description="Specify the maximum amount of regions"
									required
									class="mx-3 my-5"
								>
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
								</InputWrapper>

								<InputWrapper
									label="Tiles Per Region"
									description="Specify the amount of tiles per region"
									required
									class="mx-3 my-5"
								>
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
								</InputWrapper>

								{#if form?.invalid}
									<Alert icon={Information} title="Error">Form information is invalid</Alert>
								{/if}
							</Stack>
							<Button>Submit</Button>
						</form>
					</Box>
				{/if}
				<Divider size="lg" label="Worlds" labelPosition="left" />
				{#if !data.server.worlds.length}
					<p>None</p>
				{/if}
				<Container class="w-full flex p-0 m-0">
					{#each data.server.worlds as world, i}
						<Button
							href="/admin/worlds/{world.id}"
							class="mx-1 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
						>
							{i}
						</Button>
					{/each}
				</Container>
			</Card.Section>
		</Card>
		<Card p={0} class="bg-slate-50 rounded-md mx-5 my-5">
			<Card.Section class="px-6 py-1 w-full">
				<Divider size="lg" label="Players" labelPosition="left" />
				{#if !data.server.playerProfiles.length}
					<p>None</p>
				{/if}
				<Container class="w-full flex p-0 m-0">
					{#each data.server.playerProfiles as playerProfile, i}
						<Button
							href="/admin/players/{playerProfile.id}"
							class="mx-1 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
						>
							{i}
						</Button>
					{/each}
				</Container>
			</Card.Section>
		</Card>
	</Card>
</Box>
