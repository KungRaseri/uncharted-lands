<script lang="ts">
	import '../app.css';
	import Header from '$lib/components/app/Header.svelte';
	import Footer from '$lib/components/app/Footer.svelte';

	import { onMount } from 'svelte';
	let pageName: string;

	onMount(async () => {
		// let test = await fetch(
		// 	`${
		// 		import.meta.env.VITE_API_URL
		// 	}/weather/getgeolocation?q=Wenatchee&limit=5&apiId=41ce5f680911dcb7b1fe03babaf75ad4`
		// ).then((res) => {
		// 	return res.json();
		// });
	});
</script>

<div class="bg-gray-800 flex flex-col">
	<div class="pb-32">
		<Header />
	</div>

	<div class="-mt-32 min-h-min mb-64">
		<div class="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
			<div class="bg-indigo-50 rounded-lg shadow px-5 py-6 sm:px-6">
				<slot />
			</div>
		</div>
	</div>

	<div class="bg-gray-700 fixed bottom-0 inset-x-0 h-53">
		<Footer />
	</div>
</div>
