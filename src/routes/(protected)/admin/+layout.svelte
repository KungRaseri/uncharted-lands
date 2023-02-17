<script lang="ts">
	import { AppShell } from '@skeletonlabs/skeleton';
	import { writable, type Writable } from 'svelte/store';
	import Navigation from '$lib/components/admin/Navigation.svelte';
</script>

<svelte:head>
	<title>Administration | Uncharted Lands</title>
</svelte:head>

<AppShell slotSidebarLeft="" slotPageContent="overflow-y-scroll">
	<svelte:fragment slot="sidebarLeft">
		<Navigation />
	</svelte:fragment>
	<div class="px-5 py-2">
		<slot />
	</div>
</AppShell>
