<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton';
</script>

<AppBar
	gridColumns="grid-cols-3"
	slotDefault="place-self-center"
	slotTrail="place-content-end"
	padding="px-2 py-2"
	background="bg-surface-200-700-token"
	shadow="shadow-md"
	class="justify-between"
>
	<svelte:fragment slot="lead">lead</svelte:fragment>

	<div class="btn-group">
		<a href="/game" class="variant-glass-secondary">Overview</a>
		<a href="/game/settlements" class="variant-glass-secondary">Settlements</a>
		<a href="/game/map" class="variant-glass-secondary">Map</a>
		<a href="/game/wardens" class="variant-glass-secondary">Wardens</a>
	</div>

	<svelte:fragment slot="trail">trail</svelte:fragment>
</AppBar>
