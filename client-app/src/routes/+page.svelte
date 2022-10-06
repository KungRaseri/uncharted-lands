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

<main>
	<!-- Hero section -->
	<div class="relative">
		<div class="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100" />
		<div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
			<div class="relative shadow-xl sm:overflow-hidden sm:rounded-2xl">
				<div class="absolute inset-0">
					<div
						class="absolute inset-0 bg-gradient-to-r from-purple-800 to-indigo-700 mix-blend-multiply"
					/>
				</div>
				<div class="relative px-4 py-16 sm:px-6 sm:py-24 lg:py-32 lg:px-8">
					<h1 class="text-center text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
						<span class="block text-white">Settle in uncharted lands</span>
						<span class="block text-indigo-200">and build a community</span>
					</h1>
					<p class="mx-auto mt-6 max-w-lg text-center text-xl text-indigo-200 sm:max-w-3xl">
						Utilize the resources around you to build a strong community and ward against the
						dangers of wildlife
					</p>
					<div class="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
						<div class="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-3 sm:gap-5 sm:space-y-0">
							<a
								href="/introduction"
								class="flex items-center justify-center rounded-md border border-transparent bg-indigo-700 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-500 sm:px-8"
								>Introduction</a
							>
							<a
								href="/auth/register"
								class="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 text-base font-medium text-indigo-700 shadow-sm hover:bg-indigo-100 sm:px-8"
								>Get started</a
							>
							<a
								href="/auth/login"
								class="flex items-center justify-center rounded-md border border-transparent bg-indigo-500 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-opacity-70 sm:px-8"
								>Login</a
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Logo Cloud -->
	<div class="bg-gray-100">
		<div class="mx-auto max-w-7xl py-16 px-4 sm:px-6 lg:px-8">
			<p class="text-center text-base font-semibold text-gray-500">
				Trusted by over 5 very average small businesses
			</p>
			<div class="mt-6 grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5">
				<div class="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
					<img
						class="h-12"
						src="https://tailwindui.com/img/logos/tuple-logo-gray-400.svg"
						alt="Tuple"
					/>
				</div>
				<div class="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
					<img
						class="h-12"
						src="https://tailwindui.com/img/logos/mirage-logo-gray-400.svg"
						alt="Mirage"
					/>
				</div>
				<div class="col-span-1 flex justify-center md:col-span-2 lg:col-span-1">
					<img
						class="h-12"
						src="https://tailwindui.com/img/logos/statickit-logo-gray-400.svg"
						alt="StaticKit"
					/>
				</div>
				<div class="col-span-1 flex justify-center md:col-span-2 md:col-start-2 lg:col-span-1">
					<img
						class="h-12"
						src="https://tailwindui.com/img/logos/transistor-logo-gray-400.svg"
						alt="Transistor"
					/>
				</div>
				<div class="col-span-2 flex justify-center md:col-span-2 md:col-start-4 lg:col-span-1">
					<img
						class="h-12"
						src="https://tailwindui.com/img/logos/workcation-logo-gray-400.svg"
						alt="Workcation"
					/>
				</div>
			</div>
		</div>
	</div>

	<!-- Gradient Feature Section -->
	<div class="bg-gradient-to-r from-purple-800 to-indigo-700">
		<div
			class="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:pt-20 sm:pb-24 lg:max-w-7xl lg:px-8 lg:pt-24"
		>
			<h2 class="text-3xl font-bold tracking-tight text-white">
				Inbox support built for efficiency
			</h2>
			<p class="mt-4 max-w-3xl text-lg text-purple-200">
				Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi lobortis.
				Blandit aliquam sit nisl euismod mattis in.
			</p>
			<div
				class="mt-12 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16"
			>
				<div>
					<div>
						<span
							class="flex h-12 w-12 items-center justify-center rounded-md bg-white bg-opacity-10"
						>
							<!-- Heroicon name: outline/inbox -->
							<svg
								class="h-6 w-6 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
								/>
							</svg>
						</span>
					</div>
					<div class="mt-6">
						<h3 class="text-lg font-medium text-white">Unlimited Inboxes</h3>
						<p class="mt-2 text-base text-purple-200">
							Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi
							lobortis.
						</p>
					</div>
				</div>

				<div>
					<div>
						<span
							class="flex h-12 w-12 items-center justify-center rounded-md bg-white bg-opacity-10"
						>
							<!-- Heroicon name: outline/users -->
							<svg
								class="h-6 w-6 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
								/>
							</svg>
						</span>
					</div>
					<div class="mt-6">
						<h3 class="text-lg font-medium text-white">Manage Team Members</h3>
						<p class="mt-2 text-base text-purple-200">
							Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi
							lobortis.
						</p>
					</div>
				</div>

				<div>
					<div>
						<span
							class="flex h-12 w-12 items-center justify-center rounded-md bg-white bg-opacity-10"
						>
							<!-- Heroicon name: outline/trash -->
							<svg
								class="h-6 w-6 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
								/>
							</svg>
						</span>
					</div>
					<div class="mt-6">
						<h3 class="text-lg font-medium text-white">Spam Report</h3>
						<p class="mt-2 text-base text-purple-200">
							Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi
							lobortis.
						</p>
					</div>
				</div>

				<div>
					<div>
						<span
							class="flex h-12 w-12 items-center justify-center rounded-md bg-white bg-opacity-10"
						>
							<!-- Heroicon name: outline/pencil-square -->
							<svg
								class="h-6 w-6 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
								/>
							</svg>
						</span>
					</div>
					<div class="mt-6">
						<h3 class="text-lg font-medium text-white">Compose in Markdown</h3>
						<p class="mt-2 text-base text-purple-200">
							Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi
							lobortis.
						</p>
					</div>
				</div>

				<div>
					<div>
						<span
							class="flex h-12 w-12 items-center justify-center rounded-md bg-white bg-opacity-10"
						>
							<!-- Heroicon name: outline/document-chart-bar -->
							<svg
								class="h-6 w-6 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
								/>
							</svg>
						</span>
					</div>
					<div class="mt-6">
						<h3 class="text-lg font-medium text-white">Team Reporting</h3>
						<p class="mt-2 text-base text-purple-200">
							Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi
							lobortis.
						</p>
					</div>
				</div>

				<div>
					<div>
						<span
							class="flex h-12 w-12 items-center justify-center rounded-md bg-white bg-opacity-10"
						>
							<!-- Heroicon name: outline/arrow-uturn-left -->
							<svg
								class="h-6 w-6 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
								/>
							</svg>
						</span>
					</div>
					<div class="mt-6">
						<h3 class="text-lg font-medium text-white">Saved Replies</h3>
						<p class="mt-2 text-base text-purple-200">
							Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi
							lobortis.
						</p>
					</div>
				</div>

				<div>
					<div>
						<span
							class="flex h-12 w-12 items-center justify-center rounded-md bg-white bg-opacity-10"
						>
							<!-- Heroicon name: outline/chat-bubble-left-ellipsis -->
							<svg
								class="h-6 w-6 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
								/>
							</svg>
						</span>
					</div>
					<div class="mt-6">
						<h3 class="text-lg font-medium text-white">Email Commenting</h3>
						<p class="mt-2 text-base text-purple-200">
							Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi
							lobortis.
						</p>
					</div>
				</div>

				<div>
					<div>
						<span
							class="flex h-12 w-12 items-center justify-center rounded-md bg-white bg-opacity-10"
						>
							<!-- Heroicon name: outline/heart -->
							<svg
								class="h-6 w-6 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								aria-hidden="true"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
								/>
							</svg>
						</span>
					</div>
					<div class="mt-6">
						<h3 class="text-lg font-medium text-white">Connect with Customers</h3>
						<p class="mt-2 text-base text-purple-200">
							Ac tincidunt sapien vehicula erat auctor pellentesque rhoncus. Et magna sit morbi
							lobortis.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Stats section -->
	<div class="relative bg-gray-900">
		<div class="absolute inset-x-0 bottom-0 h-80 xl:top-0 xl:h-full">
			<div class="h-full w-full xl:grid xl:grid-cols-2">
				<div class="h-full xl:relative xl:col-start-2">
					<img
						class="h-full w-full object-cover opacity-25 xl:absolute xl:inset-0"
						src="https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=2830&q=80&sat=-100"
						alt="People working on laptops"
					/>
					<div
						aria-hidden="true"
						class="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-gray-900 xl:inset-y-0 xl:left-0 xl:h-full xl:w-32 xl:bg-gradient-to-r"
					/>
				</div>
			</div>
		</div>
		<div
			class="mx-auto max-w-4xl px-4 sm:px-6 lg:max-w-7xl lg:px-8 xl:grid xl:grid-flow-col-dense xl:grid-cols-2 xl:gap-x-8"
		>
			<div class="relative pt-12 pb-64 sm:pt-24 sm:pb-64 xl:col-start-1 xl:pb-24">
				<h2 class="text-base font-semibold">
					<span class="bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent"
						>Valuable Metrics</span
					>
				</h2>
				<p class="mt-3 text-3xl font-bold tracking-tight text-white">
					Get actionable data that will help grow your business
				</p>
				<p class="mt-5 text-lg text-gray-300">
					Rhoncus sagittis risus arcu erat lectus bibendum. Ut in adipiscing quis in viverra
					tristique sem. Ornare feugiat viverra eleifend fusce orci in quis amet. Sit in et vitae
					tortor, massa. Dapibus laoreet amet lacus nibh integer quis. Eu vulputate diam sit tellus
					quis at.
				</p>
				<div class="mt-12 grid grid-cols-1 gap-y-12 gap-x-6 sm:grid-cols-2">
					<p>
						<span class="block text-2xl font-bold text-white">8K+</span>
						<span class="mt-1 block text-base text-gray-300"
							><span class="font-medium text-white">Companies</span> use laoreet amet lacus nibh integer
							quis.</span
						>
					</p>

					<p>
						<span class="block text-2xl font-bold text-white">25K+</span>
						<span class="mt-1 block text-base text-gray-300"
							><span class="font-medium text-white">Countries around the globe</span> lacus nibh integer
							quis.</span
						>
					</p>

					<p>
						<span class="block text-2xl font-bold text-white">98%</span>
						<span class="mt-1 block text-base text-gray-300"
							><span class="font-medium text-white">Customer satisfaction</span> laoreet amet lacus nibh
							integer quis.</span
						>
					</p>

					<p>
						<span class="block text-2xl font-bold text-white">12M+</span>
						<span class="mt-1 block text-base text-gray-300"
							><span class="font-medium text-white">Issues resolved</span> lacus nibh integer quis.</span
						>
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- CTA Section -->
	<div class="bg-white">
		<div
			class="mx-auto max-w-4xl py-16 px-4 sm:px-6 sm:py-24 lg:flex lg:max-w-7xl lg:items-center lg:justify-between lg:px-8"
		>
			<h2 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-4xl">
				<span class="block">Ready to get started?</span>
				<span
					class="-mb-1 block bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text pb-1 text-transparent"
					>Create an account and begin your journey.</span
				>
			</h2>
			<div class="mt-6 space-y-4 sm:flex sm:space-y-0 sm:space-x-5">
				<a
					href="#"
					class="flex items-center justify-center rounded-md border border-transparent bg-indigo-700 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-500 sm:px-8"
					>Introduction</a
				>
				<a
					href="#"
					class="flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 text-base font-medium text-indigo-700 shadow-sm hover:bg-indigo-100 sm:px-8"
					>Get started</a
				>
				<a
					href="#"
					class="flex items-center justify-center rounded-md border border-transparent bg-indigo-500 px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-opacity-70 sm:px-8"
					>Login</a
				>
			</div>
		</div>
	</div>
</main>
