<script lang="ts">
	import type { Component } from 'svelte';

	type Props = {
		icon: Component;
		title: string;
		message: string;
		actionHref?: string;
		actionText?: string;
		actionIcon?: Component;
	};

	let { icon, title, message, actionHref, actionText, actionIcon }: Props = $props();
</script>

<div class="p-12 text-center">
	{#if icon}
		{@const IconComponent = icon}
		<IconComponent size={48} class="mx-auto mb-4 text-surface-400" />
	{/if}
	<h3 class="text-xl font-semibold mb-2">{title}</h3>
	<p class="text-surface-600 dark:text-surface-400 mb-4">{message}</p>
	{#if actionHref && actionText}
		<a href={actionHref} class="btn preset-filled-primary-500 rounded-md">
			{#if actionIcon}
				{@const ActionIcon = actionIcon}
				<ActionIcon size={20} />
			{/if}
			<span>{actionText}</span>
		</a>
	{/if}
</div>
