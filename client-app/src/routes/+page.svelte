<script lang="ts">
	import { state, connect } from '$lib/state';
	import { page } from '$app/stores';

	import { onMount } from 'svelte';

	onMount(async () => {
		// let test = await fetch(
		// 	`${
		// 		import.meta.env.VITE_API_URL
		// 	}/weather/getgeolocation?q=Wenatchee&limit=5&apiId=41ce5f680911dcb7b1fe03babaf75ad4`
		// ).then((res) => {
		// 	return res.json();
		// });
		// console.log('mounted', test);
	});
</script>

<div class="mx-auto mt-10 w-11/12 xs:w-1/3 h-full">
	<div class="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
		<div class="absolute inset-0">
			<div
				class="absolute inset-0 bg-gradient-to-r from-primary-700 to-secondary-700 mix-blend-multiply"
			/>
		</div>
		<div class="relative py-16 px-8">
			<h1 class="text-center text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
				<span class="block text-primary-200">Settle in uncharted lands</span>
				<span class="block text-secondary-200">and build a community</span>
			</h1>
			<p class="m-5 text-center text-4xl tracking-tight sm:text-5xl lg:text-6xl">
				<span class="text-tertiary-50">
					Utilize the resources around you to build a strong community and ward against the dangers
					of wildlife
				</span>
			</p>
			<div class="mx-auto w-1/2 grid">
				<a
					href="/introduction"
					class="w-full px-3 py-2 my-5 mx-5 rounded-md bg-secondary-900 text-center hover:bg-secondary-800"
				>
					<span class="text-secondary-50"> Introduction </span>
				</a>
				<a
					href="/register"
					class="w-full px-3 py-2 my-5 mx-5 rounded-md bg-secondary-900 text-center hover:bg-secondary-800"
				>
					<span class="text-secondary-50"> Register </span>
				</a>
				<a
					href="/login"
					class="w-full px-3 py-2 my-5 mx-5 rounded-md bg-secondary-900 text-center hover:bg-secondary-800"
				>
					<span class="text-secondary-50"> Login </span>
				</a>
			</div>
		</div>
	</div>
</div>
