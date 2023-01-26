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

<div class="mt-5 w-full lg:mx-auto lg:w-2/4 h-full">
	<div class="relative shadow-xl lg:overflow-hidden lg:rounded-2xl">
		<div class="absolute inset-0">
			<div
				class="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 mix-blend-multiply"
			/>
		</div>
		<div class="relative p-5">
			<h1 class="text-center text-3xl font-bold tracking-tight md:text-4xl">
				<span class="block text-primary-200">Settle in uncharted lands</span>
				<span class="block text-secondary-200">and build a community</span>
			</h1>
			<p class="m-5 text-center text-xl tracking-tight">
				<span class="text-tertiary-50">
					Utilize the resources around you to build a strong community and ward against the dangers
					of wildlife and the environment
				</span>
			</p>
			<div class="mx-auto flex space-x-2">
				<a href="/introduction" class="btn variant-soft-secondary w-full">
					<span class="text-secondary-50">Introduction</span>
				</a>
				<a href="/register" class="btn variant-soft-secondary w-full">
					<span class="text-secondary-50">Register</span>
				</a>
				<a href="/login" class="btn variant-soft-secondary w-full">
					<span class="text-secondary-50">Login</span>
				</a>
			</div>
		</div>
	</div>
</div>
