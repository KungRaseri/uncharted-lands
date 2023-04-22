<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="card p-4 m-5">
	<header class="card-header"><h2>Settlements Overview</h2></header>
	<section class="p-4">
		{#each data.settlements as settlement}
			<a href="/game/settlements/{settlement.id}/">{settlement.id}</a> | {settlement.name}
		{/each}
	</section>
</div>
