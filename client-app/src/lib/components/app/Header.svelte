<script lang="ts">
	import Navbar from './Navbar.svelte';
	export let classes: string;
</script>

<header class="flex-row min-w-full">
	<div class={classes}>
		<Navbar />
	</div>
</header>
