<script lang="ts">
	import { Search } from 'lucide-svelte';

	type Props = {
		value: string;
		placeholder?: string;
		resultCount?: number;
		totalCount?: number;
	};

	let { value = $bindable(''), placeholder = 'Search...', resultCount, totalCount }: Props = $props();
</script>

<div class="card preset-filled-surface-100-900 p-4">
	<div class="relative">
		<Search size={20} class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
		<input
			bind:value
			type="search"
			{placeholder}
			class="input pl-10 w-full"
		/>
	</div>
	{#if value && resultCount !== undefined}
		<p class="text-sm text-surface-600 dark:text-surface-400 mt-2">
			Found {resultCount} result{resultCount === 1 ? '' : 's'}
			{#if totalCount !== undefined && totalCount !== resultCount}
				(filtered from {totalCount})
			{/if}
		</p>
	{/if}
</div>
