<script lang="ts">
	import type { Prisma } from '@prisma/client';
	import World from '$lib/components/game/map/World.svelte';

	type Props = {
		world: Prisma.WorldGetPayload<{
			include: {
				regions: true;
				server: true;
			};
		}>;
		worldInfo: { landTiles: number; oceanTiles: number; settlements: number };
	};

	let { world, worldInfo }: Props = $props();
</script>

<div class="card">
	<header class="card-header flex space-x-3">
		<h2>{world.name} {`<${world.id}>`}</h2>
	</header>

	<hr class="m-2" />

	<section class="p-4">
		<h2>Details</h2>
		<hr class="m-2" />

		<div class="card">
			<section class="p-4">
				<div class="grid grid-cols-3 gap-4 text-center">
					<div>
						<p class="text-2xl font-bold text-success-500">{worldInfo.landTiles}</p>
						<p class="text-sm">Land Tiles</p>
					</div>
					<div>
						<p class="text-2xl font-bold text-primary-500">{worldInfo.oceanTiles}</p>
						<p class="text-sm">Ocean Tiles</p>
					</div>
					<div>
						<p class="text-2xl font-bold text-error-500">{worldInfo.settlements}</p>
						<p class="text-sm">Settlements</p>
					</div>
				</div>
			</section>
		</div>

		<h2>Map</h2>

		<hr class="m-2" />

		{#if world.regions}
			<!-- Note: This component needs regions with tiles included in the query -->
			<p class="text-sm text-surface-600 dark:text-surface-400 mb-4">
				Map display requires detailed tile data. View full world details in the admin section.
			</p>
		{/if}
	</section>
</div>
