<script lang="ts">
	import { TrendingUp, Globe, CloudRain, Thermometer } from 'lucide-svelte';
	import type { SettlementWithStorage } from '$lib/types/game';

	type Props = {
		settlement: SettlementWithStorage;
	};

	let { settlement }: Props = $props();
</script>

<div class="card">
	<header class="card-header">
		<h3>Settlement Details {`[${settlement.id}]`}</h3>
	</header>
	<section class="p-4">
		<p><strong>Name:</strong> {settlement.name}</p>
		<p><strong>Player Profile ID:</strong> {settlement.playerProfileId}</p>
		{#if settlement.Structures && settlement.Structures.length > 0}
			<p><strong>Structures:</strong></p>
			<ul>
				{#each settlement.Structures as structure}
					<li>{structure.type} (ID: {structure.id})</li>
				{/each}
			</ul>
		{/if}
	</section>
	<footer class="card-footer">
		<span class="badge preset-filled-secondary-500">
			Food Storage: {settlement.Storage?.food || 0}
		</span>
		<span class="badge preset-filled-secondary-500">
			Water Storage: {settlement.Storage?.water || 0}
		</span>
		<span class="badge preset-filled-secondary-500">
			Wood Storage: {settlement.Storage?.wood || 0}
		</span>
		<span class="badge preset-filled-secondary-500">
			Stone Storage: {settlement.Storage?.stone || 0}
		</span>
		<span class="badge preset-filled-secondary-500">
			Ore Storage: {settlement.Storage?.ore || 0}
		</span>
	</footer>
</div>
