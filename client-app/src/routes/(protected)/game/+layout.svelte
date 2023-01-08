<script>
	import { Box, Container, Tabs } from '@svelteuidev/core';
	import GameNavigation from '$lib/components/game/Navigation.svelte';
	import GameFooter from '$lib/components/game/Footer.svelte';
</script>

<Container>
	<GameNavigation />
	<slot />
	<GameFooter />
</Container>
