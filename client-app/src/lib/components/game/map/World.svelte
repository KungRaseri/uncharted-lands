<script lang="ts">
	import Region from './Region.svelte';

	const Regions: any = [];
</script>

<div class="p-0 m-0">
	<div class="grid grid-cols-10 align-middle justify-center">
		{#each Regions as RegionInfo}
			<div class="col-span-1"><Region {RegionInfo} /></div>
		{/each}
	</div>
</div>
