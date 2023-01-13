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

	import Edit from 'svelte-material-icons/TooltipEdit.svelte';
	import Information from 'svelte-material-icons/Information.svelte';
	import Close from 'svelte-material-icons/Close.svelte';

	let isWorldFormActive = false;

	function toggleWorldForm() {
		isWorldFormActive = !isWorldFormActive;
	}

	function closeWorldForm() {
		isWorldFormActive = !isWorldFormActive;
	}

	export let data: PageData;
	export let form: ActionData;
</script>

<Box class="m-1">
	<Card p={0} class="bg-slate-200 rounded-md mx-1 my-5">
		<Card.Section class="px-6 py-2 w-full flex">
			<Text class="text-xl">{data.region.id}</Text>
			<span
				class="absolute right-0 py-0.5 px-2 mx-2 my-1 rounded-full text-xs font-medium 
				{data.region.World.Server.status == 'ONLINE'
					? 'bg-green-100  text-green-800'
					: 'bg-red-100  text-red-800'}"
			>
				{data.region.World.Server.status}
			</span>
		</Card.Section>
		<Card p={0} class="bg-slate-50 rounded-md mx-5 my-5 p-1">
			<Card.Section class="px-6 py-1 w-full">
				<Divider size="lg" label="Tiles" labelPosition="left" />
				{#if !data.region.tiles.length}
					<p>None</p>
				{/if}
				<Container class="w-full p-0 m-0 grid grid-cols-10">
					{#each data.region.tiles as tile, i}
						<Button
							href="/admin/tiles/{tile.id}"
							class="m-1 py-10 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
						>
							{tile.type}
						</Button>
					{/each}
				</Container>
			</Card.Section>
		</Card>
	</Card>
</Box>
