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
		Paper,
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

	export let data: PageData;
</script>

<Box class="m-1">
	<Card p={0} class="bg-slate-200 rounded-md mx-1 my-5">
		<Card.Section class="px-6 py-2 w-full flex">
			<Text class="text-xl">{data.tile.id}</Text>
		</Card.Section>
		<Card p={0} class="bg-slate-50 rounded-md mx-5 my-5 p-1">
			<Card.Section class="px-6 py-1 w-full">
				<Divider size="lg" label="Settlement" labelPosition="left" />
				{#if !data.tile.settlementId}
					<p>None</p>
				{/if}

				{#if data.tile.settlementId}
					<Paper class="w-1/2">
						<Text class="text-lg">{data.tile.settlement?.name}</Text>

						<Box class="flex">
							<span class="bg-slate-300 rounded-full py-1 px-2 mx-1 w-fit">
								<Text class="text-xs text-gray-500">ID: {data.tile.settlementId}</Text>
							</span>
							<span class="bg-slate-300 rounded-full py-1 px-2 mx-1 w-fit">
								<Text class="text-xs text-gray-500">
									Profile ID: {data.tile.settlement?.playerProfileId}
								</Text>
							</span>
						</Box>
					</Paper>
				{/if}
				<Divider size="lg" label="Resources" labelPosition="left" />

				{#if !data.tile.resources.length}
					<p>None</p>
				{/if}
				<Container class="w-full flex p-0 m-0">
					{#each data.tile.resources as resource, i}
						<Button
							href="/admin/resources/{resource.id}"
							class="m-1 p-2 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
						>
							{resource.resource} [{resource.value}]
						</Button>
					{/each}
				</Container>
			</Card.Section>
		</Card>
	</Card>
</Box>
