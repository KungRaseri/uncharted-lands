<script lang="ts">
	import type { PageData } from './$types';
	import { generateMapData } from './map-generator.ts';
	const mapData = generateMapData();

	export let data: PageData;

</script>

<div class="map">
	{#each mapData as regionData}
		<div class="region">
			{#each regionData as tileData}
				<div
					class="tile"
					style="
            background-color: hsl(
              {(tileData.elevation + 1) * 50},
              {Math.max(tileData.precipitation * 50, 0)}%,
              {Math.max((1 - Math.abs(tileData.temperature)) * 50, 0)}%
            );
          "
				/>
			{/each}
		</div>
	{/each}
</div>

<style>
	.map {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		gap: 1rem;
	}

	.region {
		display: grid;
		grid-template-columns: repeat(10, 1fr);
		grid-template-rows: repeat(10, 1fr);
		gap: 0.1rem;
		border: 1px solid #ccc;
	}

	.tile {
		width: 1rem;
		height: 1rem;
		border: 1px solid #fff;
	}
</style>
