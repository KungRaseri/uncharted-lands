<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="card p-4">
	<header class="card-header">
		<h2>{data.settlement.name}</h2>
		<span class="text-xs">{data.settlement.id}</span>
	</header>

	<div class="p-4 space-y-5">
		<div class="card p-4">
			<h3>Structures</h3>
			{#each data.settlement.structures as structure}
				<div class="badge variant-ghost-secondary">
					{structure.name}
					{structure.description}

					{#each structure.modifiers as modifier}
						<div>
							{modifier.name}
							{modifier.description}
							{modifier.value}
						</div>
					{/each}
				</div>
			{/each}
		</div>
		<div class="card p-4">
			<header class="card-header">
				<h3>Plot</h3>
				<span class="text-xs">{data.settlement.Plot.id}</span>
			</header>

			<hr class="my-2" />

			<div class="p-4">
				<h4>Resources</h4>
				{#each data.settlement.Plot.resources as plotResource}
					<div class="badge variant-ghost-secondary">
						{plotResource.Resource.name}
						{plotResource.value}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
