<script lang="ts">
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import { Sun, Moon } from 'lucide-svelte';
	import { onMount } from 'svelte';

	let checked = $state(false);
	let mounted = $state(false);

	// Initialize from localStorage on mount
	onMount(() => {
		const mode = localStorage.getItem('mode') || 'light';
		checked = mode === 'dark';
		document.documentElement.setAttribute('data-mode', mode);
		mounted = true;
	});

	// Handle theme change
	function onCheckedChange(event: { checked: boolean }) {
		const mode = event.checked ? 'dark' : 'light';
		document.documentElement.setAttribute('data-mode', mode);
		localStorage.setItem('mode', mode);
		checked = event.checked;
	}
</script>

<!-- Script to run before hydration to prevent flash -->
<svelte:head>
	<script>
		// Initialize theme immediately to prevent flash
		(function() {
			const mode = localStorage.getItem('mode') || 'light';
			document.documentElement.setAttribute('data-mode', mode);
		})();
	</script>
</svelte:head>

<div class="flex items-center gap-2">
	<Sun size={16} class="text-surface-600 dark:text-surface-400" />
	<Switch {checked} onCheckedChange={onCheckedChange}>
		<Switch.Control>
			<Switch.Thumb />
		</Switch.Control>
	</Switch>
	<Moon size={16} class="text-surface-600 dark:text-surface-400" />
</div>
