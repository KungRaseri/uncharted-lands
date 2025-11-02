<script lang="ts">
	import type { Prisma, Tile } from '@prisma/client';
	import { TrendingUp, Globe, CloudRain, Thermometer } from 'lucide-svelte';

	type Props = {
		tile: Prisma.TileGetPayload<{ include: { Biome: true } }>;
	};

	let { tile }: Props = $props();
</script>

<div class="card">
	<header class="card-header"><h2>Tile Details</h2></header>
	<section class="p-4">
		<ul class="list">
			<li class="list-item">
				<span><Globe size={24} /></span>
				<span class="flex-auto">Biome: {tile.Biome.name}</span>
			</li>
			<li class="list-item">
				<span><TrendingUp size={24} /></span>
				<span class="flex-auto">
					Elevation: {(tile.elevation * 10000).toPrecision(8)} ({tile.elevation})
				</span>
			</li>
			<li class="list-item">
				<span><CloudRain size={24} /></span>
				<span class="flex-auto">
					Precipitation: {tile.precipitation.toPrecision(5)} ({tile.precipitation})
				</span>
			</li>
			<li class="list-item">
				<span><Thermometer size={24} /></span>
				<span class="flex-auto">
					Temperature: {tile.temperature.toPrecision(4)} ({tile.temperature})
				</span>
			</li>
		</ul>
	</section>
</div>
