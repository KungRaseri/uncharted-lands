<script lang="ts">
	import { page } from '$app/stores';
	import { Box, Text, Title } from '@svelteuidev/core';
</script>

<Box class="my-3">
	<Title>Admin Dashboard</Title>
	<Text>Welcome, {$page.data.account.email}</Text>
</Box>
