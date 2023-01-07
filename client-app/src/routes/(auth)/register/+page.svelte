<script lang="ts">
	import {
		Alert,
		Box,
		Button,
		Card,
		Container,
		Grid,
		InputWrapper,
		Stack,
		TextInput,
		Title
	} from '@svelteuidev/core';
	import Information from 'svelte-material-icons/Information.svelte';
	import type { ActionData } from './$types';
	import house from '$lib/images/house-foggy-bg.jpg';
	import { invalidateAll } from '$app/navigation';
	import { applyAction, enhance } from '$app/forms';
	import { slide } from 'svelte/transition';
	import { elasticInOut } from 'svelte/easing';

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
						<Box class="mt-6">
							<Title>Register your account</Title>
						</Box>
					</div>

					<div class="mt-8">
						<div class="mt-6">
							<form
								action="?/register"
								method="POST"
								use:enhance={() => {
									return async ({ result }) => {
										invalidateAll();

										applyAction(result);
									};
								}}
							>
								<Stack>
									<InputWrapper label="Email" required>
										<input
											class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
											id="email"
											type="email"
											name="email"
											required
										/>
									</InputWrapper>
									<InputWrapper
										label="Password"
										description="16+ length, alphanumeric, upper and lower casing, symbols"
										required
									>
										<input
											class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
											id="password"
											type="password"
											name="password"
											autocomplete="current-password"
										/>
									</InputWrapper>
									{#if form?.invalid}
										<Alert icon={Information} title="Error">Form information is invalid</Alert>
									{/if}
									{#if form?.length}
										<Alert icon={Information} title="Error">
											Password must be 16 or more characters in length
										</Alert>
									{/if}
									{#if form?.exists}
										<Alert icon={Information} title="Error">Account exists.</Alert>
									{/if}
									<Button>Register</Button>
								</Stack>
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
