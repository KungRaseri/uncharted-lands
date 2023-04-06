<script lang="ts">
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
					{data.plot.Settlement.PlayerProfile.profile.username}
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
		<div class="w-full p-0 m-0">
			<h3>Attributes</h3>

			<div class="card m-0 p-3">
				<div class="">
					Area: {data.plot.attributes.area}
					Solar: {data.plot.attributes.solar}
					Wind: {data.plot.attributes.wind}
					Wildlife: {data.plot.attributes.wildlife}
					Forest: {data.plot.attributes.forest}
					Rocks: {data.plot.attributes.rocks}
					Minerals: {data.plot.attributes.minerals}
				</div>
			</div>
		</div>
	</div>
</div>
