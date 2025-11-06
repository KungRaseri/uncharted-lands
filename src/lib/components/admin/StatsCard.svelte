<script lang="ts">
	import type { ComponentType } from 'svelte';

	type Props = {
		label: string;
		value: number | string;
		icon: ComponentType;
		href?: string;
		iconColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
	};

	let { label, value, icon, href, iconColor = 'primary' }: Props = $props();

	const colorClasses = {
		primary: 'bg-primary-500/10 text-primary-500',
		secondary: 'bg-secondary-500/10 text-secondary-500',
		success: 'bg-success-500/10 text-success-500',
		warning: 'bg-warning-500/10 text-warning-500',
		error: 'bg-error-500/10 text-error-500'
	};

	const ElementType = href ? 'a' : 'div';
</script>

<svelte:element
	this={ElementType}
	{href}
	class="card preset-filled-surface-100-900 p-6 {href ? 'hover:preset-tonal-primary-500 transition-colors' : ''}"
>
	<div class="flex items-start justify-between">
		<div>
			<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">{label}</p>
			<p class="text-3xl font-bold">{value}</p>
		</div>
		{#if icon}
			{@const IconComponent = icon}
			<div class="p-3 {colorClasses[iconColor]} rounded-lg">
				<IconComponent size={24} />
			</div>
		{/if}
	</div>
</svelte:element>
