<script lang="ts">
	import { AppBar } from '@skeletonlabs/skeleton';
</script>

<AppBar
	padding="px-2 py-3"
	background="bg-surface-100-800-token"
	shadow="shadow-md"
	class="justify-between"
>
	<svelte:fragment slot="lead">lead</svelte:fragment>

	<div class="btn-group">
		<button class="variant-soft-secondary">Overview</button>
		<button class="variant-soft-secondary">Settlements</button>
		<button class="variant-soft-secondary">Map</button>
		<button class="variant-soft-secondary">Wardens</button>
	</div>

	<svelte:fragment slot="trail">trail</svelte:fragment>
</AppBar>
