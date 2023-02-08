<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton';
</script>

<AppBar
	gridColumns="grid-cols-3"
	slotDefault="place-self-center"
	slotTrail="place-content-end"
	padding="px-2 py-2"
	background="bg-tertiary-50-900-token"
	shadow="shadow-md"
	class="justify-between"
>
	<svelte:fragment slot="lead">lead</svelte:fragment>

	<div class="btn-group">
		<button class="variant-glass-secondary">Overview</button>
		<button class="variant-glass-secondary">Settlements</button>
		<button class="variant-glass-secondary">Map</button>
		<button class="variant-glass-secondary">Wardens</button>
	</div>

	<svelte:fragment slot="trail">trail</svelte:fragment>
</AppBar>
