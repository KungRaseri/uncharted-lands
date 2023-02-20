<script lang="ts">
	import World from '$lib/components/game/map/World.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<ol class="breadcrumb">
	<li class="crumb"><a href="/admin/">Dashboard</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li class="crumb"><a href="/admin/servers/{data.world.serverId}/">Server</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li>{data.world.name} [{data.world.id}]</li>
</ol>

<div class="card p-4">
	<header class="card-header flex space-x-3">
		<h2>{data.world.name} {`<${data.world.id}>`}</h2>
	</header>

	<hr class="m-2" />

	<div class="" />

	<div class="p-4">
		<h2>Map</h2>

		<hr class="m-2" />

		{#if data.world.regions}
			<World regions={data.world.regions} />
		{/if}
	</div>
</div>
