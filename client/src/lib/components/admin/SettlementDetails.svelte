<script lang="ts">
	import type { SettlementWithStorage } from '@uncharted-lands/shared';

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
		{#if settlement.structures && settlement.structures.length > 0}
			<p><strong>Structures:</strong></p>
			<ul>
				{#each settlement.structures as structure}
					<li>{structure.type} (ID: {structure.id})</li>
				{/each}
			</ul>
		{/if}
	</section>
	<footer class="card-footer">
		<span class="badge preset-filled-secondary-500">
			Food Storage: {settlement.storage?.food || 0}
		</span>
		<span class="badge preset-filled-secondary-500">
			Water Storage: {settlement.storage?.water || 0}
		</span>
		<span class="badge preset-filled-secondary-500">
			Wood Storage: {settlement.storage?.wood || 0}
		</span>
		<span class="badge preset-filled-secondary-500">
			Stone Storage: {settlement.storage?.stone || 0}
		</span>
		<span class="badge preset-filled-secondary-500">
			Ore Storage: {settlement.storage?.ore || 0}
		</span>
	</footer>
</div>
