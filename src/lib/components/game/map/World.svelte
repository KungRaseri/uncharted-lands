<script lang="ts">
	import WorldMap from '$lib/components/shared/WorldMap.svelte';

	// Regions can be full Prisma payloads or minimal server-returned shapes; accept any for flexibility
	type Props = {
		regions: any[];
		playerProfileId?: string;
		lazyLoadEnabled?: boolean;
	};

	let { regions, playerProfileId, lazyLoadEnabled = false }: Props = $props();
</script>

<WorldMap {regions} mode="player" currentPlayerProfileId={playerProfileId} showLegend={true} {lazyLoadEnabled} />
