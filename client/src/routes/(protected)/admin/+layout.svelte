<script lang="ts">
	import Navigation from '$lib/components/admin/Navigation.svelte';
</script>

<svelte:head>
	<title>Administration | Uncharted Lands</title>
</svelte:head>

<div class="flex h-full">
	<!-- Sidebar -->
	<aside class="flex-none">
		<Navigation />
	</aside>

	<!-- Main content -->
	<main class="flex-1 overflow-y-auto p-4">
		<slot />
	</main>
</div>
