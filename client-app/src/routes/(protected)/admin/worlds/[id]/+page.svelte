<script lang="ts">
	import {
		ActionIcon,
		Alert,
		Box,
		Button,
		Card,
		Center,
		Container,
		Divider,
		getCssText,
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

	import { getCSSFromTile } from '$lib/game/tile-helper';

	let isWorldFormActive = false;

	function toggleWorldForm() {
		isWorldFormActive = !isWorldFormActive;
	}

	function closeWorldForm() {
		isWorldFormActive = !isWorldFormActive;
	}

	export let data: PageData;
</script>

<Box class="bg-slate-200 rounded-md mx-1 my-5 p-1">
	<Divider size="lg" label="World [{data.world.id}]" labelPosition="center" />
	<Paper class="bg-slate-50 rounded-md m-5 p-5">
		<Divider size="lg" label="Regions" labelPosition="center" />
		{#if !data.world.regions.length}
			<p>None</p>
		{/if}
		<Box class="grid grid-cols-10 border border-dashed border-opacity-75 border-slate-500">
			{#each data.world.regions as region, i}
				<Box class="grid grid-cols-3">
					{#each region.tiles as tile, j}
						<a href="/admin/tiles/{tile.id}">
							<Paper
								class="m-0 rounded-none text-center align-middle 
							border-dotted border-spacing-4
							hover:bg-opacity-50
							{getCSSFromTile(tile.type)?.bg}"
							>
								<Text align="center">[{i}:{j}]</Text>
							</Paper>
						</a>
					{/each}
				</Box>
			{/each}
		</Box>
	</Paper>
</Box>
