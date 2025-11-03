<script lang="ts">
	type BreadcrumbItem = {
		label: string;
		href?: string;
	};

	type Props = {
		items: BreadcrumbItem[];
	};

	let { items }: Props = $props();
</script>

<div class="flex items-center gap-2 text-sm">
	{#each items as item, index}
		{#if index > 0}
			<span class="text-surface-400">/</span>
		{/if}
		{#if item.href}
			<a href={item.href} class="text-surface-600 dark:text-surface-400 hover:text-primary-500">
				{item.label}
			</a>
		{:else}
			<span class="font-semibold">{item.label}</span>
		{/if}
	{/each}
</div>
