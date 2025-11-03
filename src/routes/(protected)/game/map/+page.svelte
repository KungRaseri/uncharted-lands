<script lang="ts">
	import World from '$lib/components/game/map/World.svelte';
	import type { PageData } from './$types';
	import { Map, Globe, Layers } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="max-w-7xl mx-auto p-6 space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold text-surface-900 dark:text-surface-100 mb-2 flex items-center gap-2">
			<Map size={32} />
			World Map
		</h1>
		<div class="flex items-center gap-4 text-sm text-surface-600 dark:text-surface-400">
			<div class="flex items-center gap-2">
				<Globe size={16} />
				<span>{data.world.name}</span>
			</div>
			<div class="flex items-center gap-2">
				<Layers size={16} />
				<span>{data.world.regions?.length || 0} Regions</span>
			</div>
		</div>
	</div>

	<!-- Map Container -->
	<div class="card preset-filled-surface-100-900 p-6">
		<World regions={data.world.regions ?? []} />
	</div>
</div>
