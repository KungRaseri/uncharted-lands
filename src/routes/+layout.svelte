<script lang="ts">
	import '../app.css';
	import Header from '$components/Header.svelte';
	import Footer from '$components/Footer.svelte';
</script>

<Header />

<div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
	<slot />
</div>

<Footer />
