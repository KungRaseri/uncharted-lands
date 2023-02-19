<script lang="ts">
	import World from '$lib/components/game/map/World.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="card p-4">
	<header class="card-header flex space-x-3">
		<h1 class="text-xl">{data.world.name}</h1>
	</header>

	<hr class="m-2" />

	<!-- regions -->
	<div class="p-4">
		<h2>Map</h2>
		{#if data.world.regions}
			<World map={data.world.regions} />
		{/if}
	</div>
</div>
