<svelte:head>
	<title>Portal | Uncharted Lands</title>
</svelte:head>

<div class="w-full lg:mx-auto lg:w-2/4 h-full pt-5">
	<div class="relative shadow-xl lg:overflow-hidden lg:rounded-2xl">
		<div class="absolute inset-0">
			<div
				class="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600 via-surface-900 mix-blend-color"
			></div>
		</div>
		<div class="relative p-5 bg-surface-100-900">
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
				<a
					role="button"
					data-testid="main-feature-introduction"
					href="/introduction"
					class="btn preset-tonal-secondary w-full"
				>
					<span>Introduction</span>
				</a>
				<a
					role="button"
					data-testid="main-feature-register"
					href="/register"
					class="btn preset-tonal-secondary w-full"
				>
					<span>Register</span>
				</a>
				<a
					role="button"
					data-testid="main-feature-signin"
					href="/sign-in"
					class="btn preset-tonal-secondary w-full"
				>
					<span>Sign In</span>
				</a>
			</div>
		</div>
	</div>
</div>
