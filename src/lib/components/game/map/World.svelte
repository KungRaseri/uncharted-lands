<script lang="ts">
	import type { Prisma } from '@prisma/client';
	import RegionComponent from '$lib/components/game/map/Region.svelte';

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

<div class="grid grid-cols-10 p-0 border-surface-300 dark:border-surface-600 w-full xl:w-1/2 mx-auto">
	{#each regions as region}
		<div class="p-0 border-surface-300 dark:border-surface-600">
			<div class="grid grid-cols-10 p-0">
				<RegionComponent {region} />
			</div>
		</div>
	{/each}
</div>
