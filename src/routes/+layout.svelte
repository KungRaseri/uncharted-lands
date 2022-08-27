<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<div class="flex flex-col h-screen">
	<div class="bg-gray-800 pb-32">
		<Header />
		<header class="py-10">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<h1 class="text-3xl tracking-tight font-bold text-white">Dashboard</h1>
			</div>
		</header>
	</div>

	<div class="-mt-32 min-h-fit">
		<div class="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
			<div class="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
				<slot />
			</div>
			<!-- /End replace -->
		</div>
	</div>
	<div class="absolute bottom-0 inset-x-0">
		<Footer />
	</div>
</div>
