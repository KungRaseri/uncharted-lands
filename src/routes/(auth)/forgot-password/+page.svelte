<script lang="ts">
	import { Info } from 'lucide-svelte';

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
				src="logo.png"
				alt="Workflow"
			/>
			<h1 class="mt-6 text-xl lg:text-3xl tracking-tight font-bold text-primary-50">
				Forgot your password?
			</h1>
		</div>

		<form
			action="?/resetPassword"
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
				{#if form?.invalid}
					<div transition:slide>
						<div class="alert bg-error-500/10 text-error-900 dark:text-error-50 mx-5 mt-5">
							<div class="alert-message text-primary-50">
								<Info size={24} />
								<div class="grid grid-cols-1">Form information is invalid</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
			<button class="w-full p-2 btn btn-base variant-ghost-primary">Reset Password</button>
		</form>
	</div>
</div>
