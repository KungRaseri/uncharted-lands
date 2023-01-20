<script lang="ts">
	import house from '$lib/images/house-foggy-bg.jpg';
	import Icon from 'mdi-svelte';
	import Discord from 'svelte-material-icons/Discord.svelte';
	import Information from 'svelte-material-icons/Information.svelte';
	import { mdiGoogle, mdiGithub } from '@mdi/js';

	import type { ActionData } from './$types';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	import { slide } from 'svelte/transition';

	export let form: ActionData;
</script>

<div class="w-1/5 mx-auto mt-10 px-5 pt-5 pb-10 bg-surface-700">
	<div class="justify-center">
		<div class="mx-auto w-full max-w-sm lg:w-96">
			<div class="flex">
				<img
					class="w-10 pt-6 mr-2"
					src="https://tailwindui.com/img/logos/workflow-mark.svg?color=indigo&shade=600"
					alt="Workflow"
				/>
				<h1 class="mt-6 text-3xl tracking-tight font-bold text-primary-50">
					Sign into your account
				</h1>
			</div>

			<div class="mt-8">
				<div class="mt-6">
					<form
						action="?/login"
						method="POST"
						class="space-y-6"
						use:enhance={() => {
							return async ({ result }) => {
								invalidateAll();
								await applyAction(result);
							};
						}}
					>
						<div>
							<label for="email" class="block text-md font-medium text-primary-50">
								Email address
							</label>
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
							<label for="password" class="block text-md font-medium text-primary-50">
								Password
							</label>
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
						</div>

						<div class="flex items-center justify-between">
							<div class="flex items-center">
								<input
									id="remember_me"
									name="remember_me"
									type="checkbox"
									class="checked:text-surface-900 focus:outline-primary-900 focus:ring-primary-900"
								/>
								<label for="remember_me" class="ml-2 block text-sm text-primary-50">
									Remember me
								</label>
							</div>

							<div class="text-sm">
								<a href="forgot-password" class="font-medium"> Forgot your password? </a>
							</div>
						</div>

						{#if form?.invalid}
							<div transition:slide>
								<div class="alert alert-error">
									<div class="alert-message text-primary-50">
										<Information size={24} />
										<div class="grid grid-cols-1">
											<span>{form?.account_info ?? ''}</span>
											<span>{form?.credentials ?? ''}</span>
										</div>
									</div>
								</div>
							</div>
						{/if}

						<button class="w-full p-2 bg-primary-900 text-primary-50 rounded-md">Login</button>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
