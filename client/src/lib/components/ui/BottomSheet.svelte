<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		onClose: () => void;
		title: string;
		height?: 'auto' | 'half' | 'full';
		children: Snippet;
	}

	let { open = false, onClose, title, height = 'auto', children }: Props = $props();

	let sheetElement = $state<HTMLDivElement | undefined>(undefined);
	let startY = 0;
	let currentY = 0;
	let isDragging = false;

	// Handle drag to close
	function handleTouchStart(e: TouchEvent) {
		startY = e.touches[0].clientY;
		isDragging = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!isDragging) return;

		currentY = e.touches[0].clientY;
		const deltaY = currentY - startY;

		// Only allow dragging down
		if (deltaY > 0 && sheetElement) {
			sheetElement.style.transform = `translateY(${deltaY}px)`;
		}
	}

	function handleTouchEnd() {
		if (!isDragging) return;
		isDragging = false;

		const deltaY = currentY - startY;

		// Close if dragged down more than 100px
		if (deltaY > 100) {
			onClose();
		}

		// Reset position
		if (sheetElement) {
			sheetElement.style.transform = '';
		}
		startY = 0;
		currentY = 0;
	}

	// Close on backdrop click
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	// Close on Escape key
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			onClose();
		}
	}

	// Prevent body scroll when modal open
	$effect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}

		// Cleanup on unmount
		return () => {
			document.body.style.overflow = '';
		};
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed top-0 left-0 right-0 bottom-0 bg-black/50 z-1000 flex items-end"
		onclick={handleBackdropClick}
		transition:fade={{ duration: 200 }}
		role="presentation"
		aria-hidden="true"
	>
		<!-- Sheet -->
		<div
			bind:this={sheetElement}
			class="w-full bg-surface-50 dark:bg-surface-900 rounded-t-2xl shadow-[0_-4px_16px_rgba(0,0,0,0.2)] max-h-[90vh] flex flex-col transition-transform duration-300"
			class:h-auto={height === 'auto'}
			class:h-[50vh]={height === 'half'}
			class:h-[90vh]={height === 'full'}
			transition:fly={{ y: 400, duration: 300 }}
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
			role="dialog"
			aria-modal="true"
			aria-labelledby="sheet-title"
		>
			<!-- Drag Handle -->
			<div class="flex justify-center py-2 cursor-grab active:cursor-grabbing" aria-hidden="true">
				<div class="w-10 h-1 bg-surface-400 dark:bg-surface-600 rounded-sm"></div>
			</div>

			<!-- Header -->
			<header
				class="flex justify-between items-center px-6 py-4 border-b border-surface-200 dark:border-surface-700"
			>
				<h2 id="sheet-title" class="text-xl font-semibold m-0">{title}</h2>
				<button
					class="flex items-center justify-center w-11 h-11 bg-transparent border-0 cursor-pointer text-2xl text-surface-600 dark:text-surface-400 rounded-full transition-colors duration-200 hover:bg-surface-200 dark:hover:bg-surface-800 active:bg-surface-300 focus-visible:outline-primary-300 focus-visible:outline-offset-2"
					onclick={onClose}
					aria-label="Close"
					type="button"
				>
					✕
				</button>
			</header>

			<!-- Content -->
			<div class="flex-1 overflow-y-auto p-6 [-webkit-overflow-scrolling:touch]">
				{@render children()}
			</div>
		</div>
	</div>
{/if}
