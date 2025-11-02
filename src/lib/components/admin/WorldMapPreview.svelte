<script lang="ts">
	import type { Prisma } from '@prisma/client';

	type Props = {
		regions: Prisma.RegionGetPayload<{
			include: {
				tiles: { include: { Biome: true; Plots: true } };
			};
		}>[];
	};

	let { regions }: Props = $props();
</script>

{#each regions as region}
	{region}
{/each}
