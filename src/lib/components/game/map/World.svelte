<script lang="ts">
	import type { Prisma } from '@prisma/client';
	import WorldMap from '$lib/components/shared/WorldMap.svelte';

	type Props = {
		regions: Prisma.RegionGetPayload<{
			include: {
				tiles: {
					include: {
						Biome: true;
						Plots: true;
					};
				};
			};
		}>[];
	};

	let { regions }: Props = $props();
</script>

<WorldMap {regions} mode="player" showLegend={true} />
