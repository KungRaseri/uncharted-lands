<script lang="ts">
	import {
		ChevronUp,
		ChevronDown,
		ChevronLeft,
		ChevronRight,
		Maximize2,
		RefreshCw
	} from 'lucide-svelte';

	interface Props {
		onPanUp: () => void;
		onPanDown: () => void;
		onPanLeft: () => void;
		onPanRight: () => void;
		onRecenter?: () => void;
		onRefresh?: () => void;
		canPanUp?: boolean;
		canPanDown?: boolean;
		canPanLeft?: boolean;
		canPanRight?: boolean;
		isLoading?: boolean;
	}

	let {
		onPanUp,
		onPanDown,
		onPanLeft,
		onPanRight,
		onRecenter,
		onRefresh,
		canPanUp = true,
		canPanDown = true,
		canPanLeft = true,
		canPanRight = true,
		isLoading = false
	}: Props = $props();
</script>

<div class="flex flex-col items-center gap-2">
	<!-- Top row: Up button -->
	<div class="flex justify-center">
		<button
			class="btn preset-filled-primary-500 btn-sm"
			onclick={onPanUp}
			disabled={!canPanUp || isLoading}
			title="Pan Up (W)"
		>
			<ChevronUp size={20} />
		</button>
	</div>

	<!-- Middle row: Left, Center actions, Right -->
	<div class="flex items-center gap-2">
		<button
			class="btn preset-filled-primary-500 btn-sm"
			onclick={onPanLeft}
			disabled={!canPanLeft || isLoading}
			title="Pan Left (A)"
		>
			<ChevronLeft size={20} />
		</button>

		<div class="flex gap-1">
			{#if onRecenter}
				<button
					class="btn preset-filled-surface-500 btn-sm"
					onclick={onRecenter}
					disabled={isLoading}
					title="Re-center on Settlement"
				>
					<Maximize2 size={16} />
				</button>
			{/if}

			{#if onRefresh}
				<button
					class="btn preset-filled-surface-500 btn-sm"
					onclick={onRefresh}
					disabled={isLoading}
					title="Refresh Map"
				>
					<RefreshCw size={16} class={isLoading ? 'animate-spin' : ''} />
				</button>
			{/if}
		</div>

		<button
			class="btn preset-filled-primary-500 btn-sm"
			onclick={onPanRight}
			disabled={!canPanRight || isLoading}
			title="Pan Right (D)"
		>
			<ChevronRight size={20} />
		</button>
	</div>

	<!-- Bottom row: Down button -->
	<div class="flex justify-center">
		<button
			class="btn preset-filled-primary-500 btn-sm"
			onclick={onPanDown}
			disabled={!canPanDown || isLoading}
			title="Pan Down (S)"
		>
			<ChevronDown size={20} />
		</button>
	</div>

	{#if isLoading}
		<p class="text-xs text-surface-600 dark:text-surface-400 animate-pulse">Loading regions...</p>
	{/if}
</div>
