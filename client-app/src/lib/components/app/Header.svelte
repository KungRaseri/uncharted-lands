<script lang="ts">
	import type { Func } from '@svelteuidev/core';
	import Navbar from './Navbar.svelte';
	export let classes: string = '';
	export let toggleDarkTheme: Func;
</script>

<header class="min-w-full p-0 m-0">
	<div class={classes}>
		<Navbar {toggleDarkTheme} />
	</div>
</header>
