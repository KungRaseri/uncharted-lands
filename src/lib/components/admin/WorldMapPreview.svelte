<script lang="ts">
	import type { Prisma } from '@prisma/client';

	export let regions: Prisma.RegionGetPayload<{
		include: {
			tiles: { include: { Biome: true; Plots: true } };
		};
	}>;
</script>

{#each regions as region}
	{region}
{/each}
