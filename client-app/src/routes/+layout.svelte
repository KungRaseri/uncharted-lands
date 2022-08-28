<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<div class="flex flex-col">
	<div class="bg-gray-800 pb-32">
		<Header pageName="Dashboard" />
	</div>

	<div class="-mt-32 min-h-min mb-64">
		<div class="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
			<div class="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
				<slot />
			</div>
		</div>
	</div>

	<div class="fixed bottom-0 inset-x-0 h-53">
		<Footer />
	</div>
</div>
