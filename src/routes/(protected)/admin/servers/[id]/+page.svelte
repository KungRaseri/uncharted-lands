<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="card p-4">
	<header class="card-header flex space-x-3">
		<h1 class="text-xl">{data.server.name}</h1>
		<span
			class="badge {data.server.status === 'ONLINE'
				? 'variant-ghost-success'
				: 'variant-ghost-error'}"
		>
			{data.server.status}
		</span>
	</header>

	<hr class="m-2" />

	<!-- players -->
	<div class="p-4">
		{#each data.server.players as player}
			<div>{player}</div>
		{/each}
	</div>

	<!-- worlds -->
	<div class="p-4">
		{#each data.server.worlds as world}
			<div class="card p-4 w-1/6">
				<header class="card-header flex space-x-3">
					<h2>{world.name}</h2>
					<span class="text-xs py-2 text-token">{world.id}</span>
				</header>
				<hr class="m-2" />
				<div class="p-4 grid grid-cols-1">
					<div class="py-2 flex">
						Server ID: {world.serverId}
					</div>
					<div>Created At: {world.createdAt.toDateString()}</div>
					<div>Updated At: {world.updatedAt.toDateString()}</div>
				</div>
			</div>
		{/each}
	</div>
</div>
