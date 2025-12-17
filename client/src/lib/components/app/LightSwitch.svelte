<script lang="ts">
	import { Switch } from '@skeletonlabs/skeleton-svelte';
	import { Sun, Moon } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let checked = $state(false);
	let mounted = $state(false);

	// Initialize from localStorage only on the client
	onMount(() => {
		if (browser) {
			const mode = localStorage.getItem('mode') || 'light';
			checked = mode === 'dark';
			mounted = true;
		}
	});

	function onCheckedChange(event: { checked: boolean }) {
		if (!browser) return;

		const mode = event.checked ? 'dark' : 'light';
		document.documentElement.setAttribute('data-mode', mode);
		localStorage.setItem('mode', mode);
		checked = event.checked;
	}
</script>

{#if mounted}
	<Switch {checked} {onCheckedChange}>
		<Switch.Control>
			<Switch.Thumb>
				<Switch.Context>
					{#snippet children(switch_)}
						{#if switch_().checked}
							<Moon class="size-4" />
						{:else}
							<Sun class="size-4" />
						{/if}
					{/snippet}
				</Switch.Context>
			</Switch.Thumb>
		</Switch.Control>
		<Switch.HiddenInput />
	</Switch>
{:else}
	<!-- Placeholder during SSR to prevent layout shift -->
	<div
		class="w-14 h-8 bg-surface-200 dark:bg-surface-700 rounded-full flex items-center justify-start p-1"
	>
		<div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
			<Sun class="size-4 text-yellow-500" />
		</div>
	</div>
{/if}
