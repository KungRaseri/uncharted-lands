<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="card p-4">
	<header class="card-header">Overview</header>
	<div class="p-4">
		{#each data.settlements as settlement}
			{settlement.id} | {settlement.name}
		{/each}
	</div>
</div>
