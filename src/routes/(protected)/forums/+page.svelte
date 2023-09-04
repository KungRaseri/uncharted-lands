<script lang="ts">
	import type { PageData } from './$types';
	
	import { TreeView, TreeViewItem, type TreeViewNode } from '@skeletonlabs/skeleton';

	import UnderConstruction from '$lib/components/app/UnderConstruction.svelte';

	export let data: PageData;
</script>

<svelte:head>
	<title>Forums - Coming Soon™ | Uncharted Lands</title>
</svelte:head>

<div class="container m-auto mt-10">
	{#each data.forums as forum}
		<TreeView>
			<TreeViewItem>
				{forum.name}
				<svelte:fragment slot="children">
					{#each forum.sub_forums as sub_forum}
					<TreeViewItem>
						{sub_forum.name}
					</TreeViewItem>
					{/each}
				</svelte:fragment>
			</TreeViewItem>
		</TreeView>
	{/each}
</div>
