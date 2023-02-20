<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="card p-4 m-5">
	<header class="card-header"><h2>Overview</h2></header>
	<div class="p-4">
		{#each data.settlements as settlement}
			{settlement.id} | {settlement.name}
		{/each}
	</div>
</div>
