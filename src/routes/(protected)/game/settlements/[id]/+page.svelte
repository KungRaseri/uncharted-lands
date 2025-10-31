<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="card p-4 m-5">
	<header class="card-header">
		<h2>{data.settlement.name}</h2>
		<span class="text-xs">{data.settlement.id}</span>
	</header>

	<div class="p-4 space-y-5">
		<div class="card p-4">
			<h3>Structures</h3>
			{#each data.settlement.Structures as structure}
				<div class="badge variant-ghost-secondary">
					{structure.name}
					{structure.description}

					{#each structure.modifiers as modifier}
						{modifier.description}
						<div class="badge variant-ghost-secondary">
							{modifier.name}
							{modifier.value}
						</div>
					{/each}
				</div>
			{/each}
		</div>
		<div class="card">
			<header class="card-header">
				<h3>
					Plot
					<div class="badge variant-ghost-secondary">
						Area: {data.settlement.Plot.area}
					</div>
					<div class="badge variant-ghost-secondary">
						Solar: {data.settlement.Plot.solar}
					</div>
					<div class="badge variant-ghost-secondary">
						Wind: {data.settlement.Plot.wind}
					</div>
				</h3>
				<span class="text-xs">{data.settlement.Plot.id}</span>
			</header>

			<hr class="my-2" />
			<section class="p-4"></section>

			<footer class="card-footer">
				<div class="badge variant-ghost-secondary">
					Food: {data.settlement.Plot.food}
				</div>
				<div class="badge variant-ghost-secondary">
					Water: {data.settlement.Plot.water}
				</div>
				<div class="badge variant-ghost-secondary">
					Wood: {data.settlement.Plot.wood}
				</div>
				<div class="badge variant-ghost-secondary">
					Stone: {data.settlement.Plot.stone}
				</div>
				<div class="badge variant-ghost-secondary">
					Ore: {data.settlement.Plot.ore}
				</div>
			</footer>
		</div>
	</div>
</div>
