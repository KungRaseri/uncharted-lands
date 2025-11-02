<script lang="ts">
	import { Info } from 'lucide-svelte';

	import type { ActionData, PageData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { slide } from 'svelte/transition';

	let isRememberMeChecked = false;

	export let data: PageData;
	export let form: ActionData;
</script>

<div class="mx-auto w-full md:w-96 mt-2 lg:mt-5 bg-surface-200-700-token">
	<div class="mx-auto w-full px-5 py-3">
		<div class="flex">
			<img class="w-20 py-5 mr-2" src="logo.png" alt="Workflow" />
			<h1 class="mt-6 text-2xl tracking-tight font-bold text-token">
				Sign into your account
			</h1>
		</div>

		<form
			action="?/login&redirectTo={data.redirectTo}"
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
				<label for="remember_me" class="label">
					<input
						id="remember_me"
						name="remember_me"
						type="checkbox"
						class="checkbox"
						bind:value={isRememberMeChecked}
					/>
					<span class="">Remember me</span>
				</label>

				<a href="forgot-password" class="font-medium">Forgot your password?</a>
			</div>

			{#if form?.email}
				<div transition:slide class="hidden lg:block">
					<div class="alert bg-error-500/10 text-error-900 dark:text-error-50 mx-5 mt-5">
						<div class="alert-message text-token justify-center items-center">
							<Info size={24} />
							<div class="grid grid-cols-1">
								<span>{form?.incorrect ? 'Information is incorrect' : ''}</span>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<button class="w-full p-2 btn bg-primary-400-500-token rounded-md"> Login </button>
		</form>
	</div>
</div>
