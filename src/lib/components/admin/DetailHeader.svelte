<script lang="ts">
	import type { Component } from 'svelte';
	import type { Snippet } from 'svelte';

	type Props = {
		title: string;
		subtitle?: string;
		icon: Component;
		iconColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
		metadata?: Snippet;
	};

	let { title, subtitle, icon, iconColor = 'primary', metadata }: Props = $props();

	const colorClasses = {
		primary: 'bg-primary-500/10 text-primary-500',
		secondary: 'bg-secondary-500/10 text-secondary-500',
		success: 'bg-success-500/10 text-success-500',
		warning: 'bg-warning-500/10 text-warning-500',
		error: 'bg-error-500/10 text-error-500'
	};
</script>

<div class="card preset-filled-surface-100-900 p-6">
	<div class="flex items-start gap-6">
		<div class="flex-none w-16 h-16 rounded-full {colorClasses[iconColor]} flex items-center justify-center">
			<svelte:component this={icon} size={32} />
		</div>

		<div class="flex-1">
			<h1 class="text-3xl font-bold mb-2">{title}</h1>
			{#if subtitle}
				<p class="text-sm text-surface-600 dark:text-surface-400 font-mono mb-4">{subtitle}</p>
			{/if}
			
			{#if metadata}
				<div class="flex flex-wrap gap-4">
					{@render metadata()}
				</div>
			{/if}
		</div>
	</div>
</div>
