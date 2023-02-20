<script lang="ts">
	import { set_custom_element_data } from 'svelte/internal';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<ol class="breadcrumb">
	<li class="crumb"><a href="/admin/">Dashboard</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li class="crumb"><a href="/admin/tiles/{data.plot.tileId}">Tile</a></li>
	<li class="crumb-separator" aria-hidden>&rsaquo;</li>
	<li>Plot [{data.plot.id}]</li>
</ol>

<div class="card p-4">
	<header class="card-header">
		<h2>{data.plot.id}</h2>
	</header>

	<div class="p-4 grid grid-cols-1">
		<h3>Tile</h3>
		<div class="card p-4">
			<header>
				<h3>{data.plot.Tile.id}</h3>
			</header>
		</div>
		<h3>Settlement</h3>
		{#if data.plot.Settlement}
			<div class="card p-4">
				<header>
					<h3>{data.plot.Settlement.id}</h3>
				</header>
				<div class="p-4">
					{data.plot.Settlement.playerProfile.profile.username}
					{data.plot.Settlement.name}
					{#each data.plot.Settlement.structures as structure}
						{structure.name}
					{/each}
				</div>
			</div>
		{:else}
			<div class="card p-4">
				<header>
					<h3>No Settlement Found</h3>
				</header>
			</div>
		{/if}
	</div>
	<div class="px-6 py-1 w-full">
		<div class="w-full flex p-0 m-0">
			<h3>Resources</h3>

			<hr class="my-2" />

			{#each data.plot.resources as resource, i}
				<a
					href="/admin/resources/{resource.id}"
					class="m-1 p-2 text-xs rounded-full bg-slate-600 text-slate-300 hover:bg-slate-500"
				>
					{resource.id} [{resource.value}]
				</a>
			{/each}
		</div>
	</div>
</div>
