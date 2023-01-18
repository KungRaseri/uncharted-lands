<script lang="ts">
	import { state, connect } from '$lib/state';
	import { page } from '$app/stores';

	import { onMount } from 'svelte';
	import { Box, Container } from '@svelteuidev/core';

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

<Box class="mx-auto mt-3 mb-48 w-full rounded-md sm:w-2/3">
	<div class="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
		<div class="absolute inset-0">
			<div
				class="absolute inset-0 bg-gradient-to-r from-purple-800 to-indigo-700 mix-blend-multiply"
			/>
		</div>
		<div class="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
			<h1 class="text-center text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
				<span class="block text-white">Settle in uncharted lands</span>
				<span class="block text-indigo-200">and build a community</span>
			</h1>
			<p class="mx-auto mt-6 max-w-lg text-center text-xl text-indigo-200 sm:max-w-3xl">
				Utilize the resources around you to build a strong community and ward against the dangers of
				wildlife
			</p>
			<div class="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
				<div class="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-3 sm:gap-5 sm:space-y-0">
					<a
						href="/introduction"
						class="flex items-center justify-center rounded-md border border-transparent bg-indigo-700 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-500 sm:px-8"
						>Introduction</a
					>
					<a
						href="/register"
						class="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 text-base font-medium text-indigo-700 shadow-sm hover:bg-indigo-100 sm:px-8"
						>Register</a
					>
					<a
						href="/login"
						class="flex items-center justify-center rounded-md border border-transparent bg-indigo-500 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-opacity-70 sm:px-8"
						>Login</a
					>
				</div>
			</div>
		</div>
	</div>
</Box>
