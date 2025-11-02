<script lang="ts">
	import type { Component } from 'svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		description?: string;
		icon?: Component;
		actions?: Snippet;
	};

	let { title, description, icon, actions }: Props = $props();
</script>

<div class="flex items-center justify-between">
	<div>
		<h1 class="text-2xl font-bold flex items-center gap-2">
			{#if icon}
				<svelte:component this={icon} size={28} />
			{/if}
			{title}
		</h1>
		{#if description}
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
				{description}
			</p>
		{/if}
	</div>
	{#if actions}
		<div>
			{@render actions()}
		</div>
	{/if}
</div>
