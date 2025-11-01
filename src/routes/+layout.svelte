<script lang="ts">
	import '../app.css';

	import Header from '$lib/components/app/Header.svelte';
	import Footer from '$lib/components/app/Footer.svelte';
</script>

<div class="flex flex-col h-screen">
	<header class="flex-none">
		<Header />
	</header>

	<main class="flex-1 overflow-y-auto">
		<slot />
	</main>

	<footer class="flex-none">
		<Footer />
	</footer>
</div>
