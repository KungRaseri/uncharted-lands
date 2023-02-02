<script lang="ts">
	import Information from 'svelte-material-icons/Information.svelte';

	import type { ActionData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { slide } from 'svelte/transition';

	let isRememberMeChecked = false;

	export let form: ActionData;
</script>

<div class="mx-auto w-full md:w-96 mt-2 lg:mt-5 bg-surface-200-700-token">
	<div class="mx-auto w-full px-5 py-3">
		<div class="flex">
			<img
				class="w-10 py-5 mr-2"
				src="https://tailwindui.com/img/logos/workflow-mark.svg?color=indigo&shade=600"
				alt="Workflow"
			/>
			<h1 class="mt-6 text-xl lg:text-2xl tracking-tight font-bold text-token">
				Sign into your account
			</h1>
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
			<label for="email" class="flex text-md font-medium text-token">
				Email address
				{#if form?.invalid}
					<span class="rounded-full mx-1 p-1 variant-ghost-error">
						<Information />
					</span>
				{/if}
			</label>
			<div class="">
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					class="variant-ghost-surface {form?.invalid ? 'input-error' : ''}"
				/>
			</div>

			<label for="password" class="flex text-md font-medium text-token">
				Password
				{#if form?.invalid}
					<span class="rounded-full mx-1 p-1 variant-ghost-error">
						<Information />
					</span>
				{/if}
			</label>
			<div class="">
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="current-password"
					required
					class="variant-ghost-surface {form?.invalid ? 'input-error' : ''}"
				/>
			</div>

			<div class="flex justify-around">
				<div class="flex">
					<input
						id="remember_me"
						name="remember_me"
						type="checkbox"
						class="checked:text-surface-900 focus:outline-primary-900 focus:ring-primary-900"
						bind:value={isRememberMeChecked}
					/>
					<label for="remember_me" class="ml-2 block text-sm text-token">Remember me</label>
				</div>

				<div class="text-sm">
					<a href="forgot-password" class="font-medium">Forgot your password?</a>
				</div>
			</div>

			{#if form?.invalid}
				<div transition:slide class="hidden lg:block">
					<div class="alert variant-ghost-error mx-5 mt-5">
						<div class="alert-message text-token justify-center items-center">
							<Information size={24} />
							<div class="grid grid-cols-1">
								<span>{form?.account_info ?? ''}</span>
								<span>{form?.credentials ?? ''}</span>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<button class="w-full p-2 btn bg-primary-400-500-token rounded-md"> Login </button>
		</form>
	</div>
</div>
