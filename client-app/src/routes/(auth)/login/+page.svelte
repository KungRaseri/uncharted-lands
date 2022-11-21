<script lang="ts">
	import house from '$lib/assets/house-foggy-bg.jpg';
	import Icon from 'mdi-svelte';
	import Discord from 'svelte-material-icons/Discord.svelte';
	import Information from 'svelte-material-icons/Information.svelte';
	import { mdiGoogle, mdiGithub } from '@mdi/js';

	import type { ActionData } from './$types';
	import { Alert, Anchor, Box, Button, Card, Container, Grid, Stack } from '@svelteuidev/core';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	import { slide } from 'svelte/transition';

	export let form: ActionData;
</script>

<Container>
	<Card p="xs" mt="lg">
		<Grid>
			<Grid.Col span={6} class="justify-center">
				<div class="mx-auto w-full max-w-sm lg:w-96">
					<div>
						<img
							class="h-12 w-auto"
							src="https://tailwindui.com/img/logos/workflow-mark.svg?color=indigo&shade=600"
							alt="Workflow"
						/>
						<h1 class="mt-6 text-3xl tracking-tight font-bold text-gray-900">
							Sign in to your account
						</h1>
					</div>

					<div class="mt-8">
						<div>
							<div>
								<p class="text-sm text-center font-medium text-gray-700">Sign in with</p>
								<div class="mt-1 grid grid-cols-3 gap-3">
									<div>
										<Button
											href="/api/auth/signin/google"
											class="w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
											disabled
										>
											<span class="sr-only">Sign in with Google</span>
											<div class="w-6 h-6 block">
												<Icon path={mdiGoogle} width="100%" height="100%" />
											</div>
										</Button>
									</div>
									<div>
										<Button
											href="/api/auth/signin/discord"
											class="w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
											disabled
										>
											<span class="sr-only">Sign in with Discord</span>
											<div class="w-6 h-6 block">
												<Discord width="100%" height="100%" />
											</div>
										</Button>
									</div>
									<div>
										<Button
											href="/api/auth/signin/github"
											class="w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
											disabled
										>
											<span class="sr-only">Sign in with Github</span>
											<div class="w-6 h-6 block">
												<Icon path={mdiGithub} width="100%" height="100%" />
											</div>
										</Button>
									</div>
								</div>
							</div>

							<div class="mt-6 relative">
								<div class="absolute inset-0 flex items-center" aria-hidden="true">
									<div class="w-full border-t border-gray-300" />
								</div>
								<div class="relative flex justify-center text-sm">
									<span class="px-2 bg-white text-gray-500"> Or continue with </span>
								</div>
							</div>
						</div>

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
									<label for="email" class="block text-sm font-medium text-gray-700">
										Email address
									</label>
									<div class="mt-1">
										<input
											id="email"
											name="email"
											type="email"
											autocomplete="email"
											required
											class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
										/>
									</div>
								</div>

								<div class="space-y-1">
									<label for="password" class="block text-sm font-medium text-gray-700">
										Password
									</label>
									<div class="mt-1">
										<input
											id="password"
											name="password"
											type="password"
											autocomplete="current-password"
											required
											class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
										/>
									</div>
								</div>

								<div class="flex items-center justify-between">
									<div class="flex items-center">
										<input
											id="remember_me"
											name="remember_me"
											type="checkbox"
											class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
										/>
										<label for="remember_me" class="ml-2 block text-sm text-gray-900">
											Remember me
										</label>
									</div>

									<div class="text-sm">
										<a
											href="forgot-password"
											class="font-medium text-indigo-600 hover:text-indigo-500"
										>
											Forgot your password?
										</a>
									</div>
								</div>

								{#if form?.invalid}
									<div transition:slide>
										<Alert icon={Information} title="Error" mx="sm">
											<Stack>
												{form?.account_info ?? ''}
												{form?.credentials ?? ''}
											</Stack>
										</Alert>
									</div>
								{/if}

								<Button
									class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
									>Login</Button
								>
							</form>
						</div>
					</div>
				</div>
			</Grid.Col>
			<Grid.Col span={6} class="hidden lg:block relative">
				<img class="absolute inset-0 h-full w-full object-cover" src={house} alt="" />
			</Grid.Col>
		</Grid>
	</Card>
</Container>
