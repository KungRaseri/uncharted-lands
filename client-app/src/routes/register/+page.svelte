<script lang="ts">
	import { Box, Button, Container, InputWrapper, Stack, TextInput, Title } from '@svelteuidev/core';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<Container>
	<Box>
		<form action="?/register" method="POST">
			<Stack>
				<Title>Register</Title>
				<InputWrapper label="" error={form?.email ? 'Email is invalid' : ''}>
					<input
						class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						id="email"
						placeholder="Email"
						type="email"
						name="email"
						required
					/>
				</InputWrapper>
				<InputWrapper label="" error={form?.username ? 'Username is invalid' : ''}>
					<input
						class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						id="username"
						placeholder="Username"
						type="text"
						name="username"
						required
					/>
				</InputWrapper>
				<InputWrapper label="" error={form?.password ? '' : ''}>
					<input
						class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						id="password"
						placeholder="Password"
						type="password"
						name="password"
						required
					/>
				</InputWrapper>
				<Button>Register</Button>
			</Stack>
		</form>
	</Box>
</Container>
