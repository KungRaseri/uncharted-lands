<script lang="ts">
	import Information from 'svelte-material-icons/Information.svelte';
	import type { ActionData } from './$types';
	import house from '$lib/images/house-foggy-bg.jpg';
	import { invalidateAll } from '$app/navigation';
	import { applyAction, enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import { elasticInOut } from 'svelte/easing';

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
					Register your account
				</h1>
			</div>

			<div class="mt-8">
				<div class="mt-6">
					<form
						action="?/register"
						method="POST"
						class="space-y-7"
						use:enhance={() => {
							return async ({ result }) => {
								invalidateAll();

								applyAction(result);
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

							{#if form?.invalid}
								<div transition:slide>
									<div class="alert alert-error mx-5 mt-5">
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
						<button class="w-full p-2 bg-primary-900 rounded-md">Register</button>
					</form>
				</div>
			</div>
		</div>
	</div>
</div>
