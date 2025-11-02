<script lang="ts">
	import { Info } from 'lucide-svelte';

	import type { ActionData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	import { slide } from 'svelte/transition';

	export let form: ActionData;
</script>

<div class="container mx-auto max-w-md mt-8 p-6">
	<div class="card preset-filled-surface-100-900 p-8 space-y-6">
		<div class="flex items-center gap-4">
			<img class="w-20" src="/logo.png" alt="Uncharted Lands" />
			<h1 class="text-2xl font-bold">
				Forgot your password?
			</h1>
		</div>

		<form
			action="?/resetPassword"
			method="POST"
			class="space-y-4"
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
					class="input"
				/>
			</label>

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
			<button class="w-full p-2 btn btn-base preset-outlined-primary-500">Reset Password</button>
		</form>
	</div>
</div>
