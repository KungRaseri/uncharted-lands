<script lang="ts">
	import { TrendingUp, Globe, CloudRain, Thermometer } from 'lucide-svelte';

	type Props = {
		settlement: any; // Simplified after Prisma removal
				};
				Storage: true;
				Structures: true;
			};
		}>;
	};

	let { settlement }: Props = $props();
</script>

<div class="card">
	<header class="card-header">
		<h3>Settlement Details {`[${settlement.id}]`}</h3>
	</header>
	<section class="p-4">
		{settlement.PlayerProfile.profile.username}
		{settlement.name}
		{#each settlement.Structures as structure}
			{structure.name}
		{/each}
	</section>
	<footer class="card-footer">
		<span class="badge preset-filled-secondary-500">
			Food Storage: {settlement.Storage.food}
		</span>
		<span class="badge preset-filled-secondary-500">
			Water Storage: {settlement.Storage.water}
		</span>
		<span class="badge preset-filled-secondary-500">
			Wood Storage: {settlement.Storage.wood}
		</span>
		<span class="badge preset-filled-secondary-500">
			Stone Storage: {settlement.Storage.stone}
		</span>
		<span class="badge preset-filled-secondary-500">
			Ore Storage: {settlement.Storage.ore}
		</span>
	</footer>
</div>
