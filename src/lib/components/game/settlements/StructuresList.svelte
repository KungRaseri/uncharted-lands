<script lang="ts">
	import type { Prisma, Structure, SettlementStructure } from '@prisma/client';

	export let settlementStructures: SettlementStructure[];

	export let structures: Structure[];
</script>

<dl class="list-dl p-4">
	{#each structures as structure}
		<div>
			<img class="btn-icon rounded-full" src={structure.image} alt={structure.name} />
			<span class="flex-auto">
				<dt>{structure.name}</dt>
				<dd>{structure.description}</dd>
			</span>
			<span class="badge variant-soft-tertiary">
				{settlementStructures.find((ss) => ss.structureId == structure.id)?.level ?? 0}
			</span>
			<div class="btn-group">
				<button class="btn-icon-sm variant-soft-success rounded-full mx-0">+</button>
				<button class="btn-icon-sm variant-glass-error rounded-full mx-0">-</button>
			</div>
		</div>
	{/each}
</dl>
