<script lang="ts">
	import Information from 'svelte-material-icons/Information.svelte';

	import type { ActionData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	import { slide } from 'svelte/transition';

	export let form: ActionData;
</script>

<div class="mx-auto w-full md:w-96 mt-2 lg:mt-5 bg-surface-700">
	<div class="mx-auto w-full px-5 py-3">
		<div class="flex">
			<img
				class="w-10 py-5 mr-2"
				src="https://tailwindui.com/img/logos/workflow-mark.svg?color=indigo&shade=600"
				alt="Workflow"
			/>
			<h1 class="mt-6 text-xl lg:text-3xl tracking-tight font-bold text-primary-50">
				Register your account
			</h1>
		</div>

		<form
			action="?/register"
			method="POST"
			class="space-y-2"
			use:enhance={() => {
				return async ({ result }) => {
					invalidateAll();
					await applyAction(result);
				};
			}}
		>
			<div>
				<label for="email" class="block text-md font-medium text-primary-50"> Email address </label>
				<div class="mt-1">
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						class="rounded-sm"
					/>
				</div>
			</div>

			<div class="space-y-1">
				<label for="password" class="block text-md font-medium text-primary-50"> Password </label>
				<div class="mt-1">
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						class="rounded-sm"
					/>
				</div>

				{#if form?.invalid}
					<div transition:slide>
						<div class="alert variant-ghost-error mx-5 mt-5">
							<div class="alert-message text-primary-50">
								<Information size={24} />
								<div class="grid grid-cols-1">Form information is invalid</div>
								{#if form?.length}
									Password must be 16 or more characters in length
								{/if}
								{#if form?.exists}
									Please enter the account information again
								{/if}
							</div>
						</div>
					</div>
				{/if}
			</div>
			<button class="w-full p-2 btn btn-base variant-ghost-primary">Register</button>
		</form>
	</div>
</div>
