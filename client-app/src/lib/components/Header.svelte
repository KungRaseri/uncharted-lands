<script lang="ts">
	import Navbar from './Navbar.svelte';
	export let pageName: string;
</script>

<header class="flex-row min-w-full">
	<Navbar />
</header>

<header class="py-10">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<h1 class="text-3xl tracking-tight font-bold text-white">{pageName}</h1>
	</div>
</header>
