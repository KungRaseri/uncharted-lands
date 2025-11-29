<script lang="ts">
	import { Info } from 'lucide-svelte';

	import type { ActionData, PageData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { slide } from 'svelte/transition';

	let isRememberMeChecked = $state(false);

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="container mx-auto max-w-md mt-8 p-6">
	<div class="card preset-filled-surface-100-900 p-8 space-y-6">
		<div class="flex items-center gap-4">
			<img class="w-20" src="/logo.png" alt="Uncharted Lands" />
			<h1 class="text-2xl font-bold">Sign into your account</h1>
		</div>

		<form
			action="?/login"
			method="POST"
			class="space-y-1 md:space-y-3"
			use:enhance={() => {
				return async ({ result }) => {
					invalidateAll();
					await applyAction(result);
				};
			}}
		>
			<label for="email" class="label">
				<span>Email address</span>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					class="input {form?.email ? 'input-error' : ''}"
				/>
			</label>

			<label for="password" class="label">
				<span>Password</span>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					class="input {form?.email ? 'input-error' : ''}"
				/>
			</label>

			<div class="flex justify-around items-center">
				<label for="remember_me" class="label flex-row items-center gap-2">
					<input
						id="remember_me"
						name="remember_me"
						type="checkbox"
						class="checkbox"
						bind:checked={isRememberMeChecked}
					/>
					<span>Remember me</span>
				</label>

				<a href="forgot-password" class="font-medium hover:underline">Forgot your password?</a>
			</div>

			{#if form?.email}
				<div transition:slide class="hidden lg:block">
					<div class="alert bg-error-500/10 text-error-900 dark:text-error-50 mx-5 mt-5">
						<div class="alert-message justify-center items-center">
							<Info size={24} />
							<div class="grid grid-cols-1">
								{#if form?.message}
									<span>{form.message}</span>
								{:else if form?.incorrect}
									<span>The email or password you entered is incorrect.</span>
								{:else if form?.missingFields}
									<span>Please provide both email and password.</span>
								{:else if form?.invalid}
									<span>Login failed. Please check your credentials and try again.</span>
								{:else}
									<span>An error occurred. Please try again.</span>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/if}
			<button type="submit" class="w-full p-2 btn preset-filled-primary-500 rounded-md">
				Login
			</button>
		</form>
	</div>
</div>
