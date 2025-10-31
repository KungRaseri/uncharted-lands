<script lang="ts">
	import WorldDetails from '$lib/components/admin/WorldDetails.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<ol class="breadcrumb m-1">
	<li class="crumb"><a href="/admin/">Dashboard</a></li>
	<li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
	<li class="crumb"><a href="/admin/servers/{data.world.serverId}/">Server</a></li>
	<li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
	<li>{data.world.name} [{data.world.id}]</li>
</ol>

<WorldDetails world={data.world} worldInfo={data.worldInfo} />
