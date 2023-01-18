<script lang="ts">
	import Navbar from './Navbar.svelte';

	export let classes: string = '';
	export let mainMenuLinks: Array<object>;
	export let userMenuLinks: Array<object>;
</script>

<header class="min-w-full p-0 m-0">
	<div class={classes}>
		<Navbar {mainMenuLinks} {userMenuLinks} />
	</div>
</header>
