<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	interface Props {
		open?: boolean;
		onClose: () => void;
		title: string;
		height?: 'auto' | 'half' | 'full';
	}

	let { open = false, onClose, title, height = 'auto' }: Props = $props();

	let sheetElement: HTMLDivElement;
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
		class="bottom-sheet-backdrop"
		onclick={handleBackdropClick}
		transition:fade={{ duration: 200 }}
		role="presentation"
		aria-hidden="true"
	>
		<!-- Sheet -->
		<div
			bind:this={sheetElement}
			class="bottom-sheet"
			class:auto={height === 'auto'}
			class:half={height === 'half'}
			class:full={height === 'full'}
			transition:fly={{ y: 400, duration: 300 }}
			ontouchstart={handleTouchStart}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
			role="dialog"
			aria-modal="true"
			aria-labelledby="sheet-title"
		>
			<!-- Drag Handle -->
			<div class="drag-handle" aria-hidden="true">
				<div class="handle-bar"></div>
			</div>

			<!-- Header -->
			<header class="sheet-header">
				<h2 id="sheet-title" class="sheet-title">{title}</h2>
				<button class="close-button" onclick={onClose} aria-label="Close" type="button"> ✕ </button>
			</header>

			<!-- Content -->
			<div class="sheet-content">
				<slot />
			</div>
		</div>
	</div>
{/if}

<style>
	.bottom-sheet-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
		display: flex;
		align-items: flex-end;
	}

	.bottom-sheet {
		width: 100%;
		background: white;
		border-radius: 1rem 1rem 0 0;
		box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.2);
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.bottom-sheet.auto {
		height: auto;
	}

	.bottom-sheet.half {
		height: 50vh;
	}

	.bottom-sheet.full {
		height: 90vh;
	}

	.drag-handle {
		display: flex;
		justify-content: center;
		padding: 0.5rem 0;
		cursor: grab;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.handle-bar {
		width: 40px;
		height: 4px;
		background: rgb(var(--color-surface-400));
		border-radius: 2px;
	}

	.sheet-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid rgb(var(--color-surface-200));
	}

	.sheet-title {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0;
	}

	.close-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background: transparent;
		border: none;
		cursor: pointer;
		font-size: 1.5rem;
		color: rgb(var(--color-surface-600));
		border-radius: 50%;
		transition: background 0.2s;
	}

	.close-button:hover {
		background: rgb(var(--color-surface-200));
	}

	.close-button:active {
		background: rgb(var(--color-surface-300));
	}

	.close-button:focus-visible {
		outline: 3px solid rgb(var(--color-primary-300));
		outline-offset: 2px;
	}

	.sheet-content {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		-webkit-overflow-scrolling: touch;
	}

	/* Dark mode support */
	:global(.dark) .bottom-sheet {
		background: rgb(var(--color-surface-900));
	}

	:global(.dark) .sheet-header {
		border-bottom-color: rgb(var(--color-surface-700));
	}

	:global(.dark) .handle-bar {
		background: rgb(var(--color-surface-600));
	}

	:global(.dark) .close-button {
		color: rgb(var(--color-surface-400));
	}

	:global(.dark) .close-button:hover {
		background: rgb(var(--color-surface-800));
	}
</style>
