<script lang="ts">
	import type { Region, Prisma } from '@prisma/client';
	import RegionComponent from '$lib/components/game/map/Region.svelte';

	export let regions: Prisma.RegionGetPayload<{ include: { tiles: true } }>;
</script>

<div class="grid grid-cols-10 p-0 border-token w-full xl:w-1/2 mx-auto">
	{#each regions as region}
		<div class="p-0 border-token">
			<div class="grid grid-cols-10 p-0">
				<RegionComponent {region} />
			</div>
		</div>
	{/each}
</div>
