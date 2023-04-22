<script lang="ts">
	import World from '$lib/components/game/map/World.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<div class="m-5">
	<World regions={data.world.regions ?? []} />
</div>
