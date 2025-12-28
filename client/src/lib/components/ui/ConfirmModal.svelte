<script lang="ts">
	/**
	 * Confirm Modal Component
	 * Reusable modal for confirmation dialogs (replaces browser confirm())
	 * WCAG 2.1 AA Compliant with keyboard navigation and focus management
	 */

	import { fade, scale } from 'svelte/transition';

	interface Props {
		open: boolean;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'danger' | 'warning' | 'info';
		onconfirm?: () => void;
		oncancel?: () => void;
	}

	let {
		open = $bindable(false),
		title,
		message,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		variant = 'warning',
		onconfirm,
		oncancel
	}: Props = $props();

	function handleConfirm() {
		onconfirm?.();
		open = false;
	}

	function handleCancel() {
		oncancel?.();
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			handleCancel();
		}
	}

	// Focus trap - focus first button when modal opens
	let confirmButton: HTMLButtonElement;
	$effect(() => {
		if (open && confirmButton) {
			setTimeout(() => confirmButton?.focus(), 100);
		}
	});

	// Get button styles based on variant
	const variantStyles = $derived.by(() => {
		switch (variant) {
			case 'danger':
				return 'variant-filled-error';
			case 'warning':
				return 'variant-filled-warning';
			case 'info':
				return 'variant-filled-primary';
			default:
				return 'variant-filled-warning';
		}
	});
</script>

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-black/60 z-[9998] backdrop-blur-sm"
		transition:fade={{ duration: 150 }}
		onclick={handleCancel}
		role="presentation"
	></div>

	<!-- Modal -->
	<div
		class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirm-modal-title"
		aria-describedby="confirm-modal-description"
		onkeydown={handleKeydown}
	>
		<div
			class="card variant-glass-surface p-6 max-w-md w-full space-y-4 shadow-2xl"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<!-- Header -->
			<header class="flex items-start gap-3">
				<div
					class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center {variant ===
					'danger'
						? 'bg-error-500/20'
						: variant === 'warning'
							? 'bg-warning-500/20'
							: 'bg-primary-500/20'}"
				>
					<span class="text-2xl" aria-hidden="true">
						{variant === 'danger' ? '⚠️' : variant === 'warning' ? '❓' : 'ℹ️'}
					</span>
				</div>
				<div class="flex-1">
					<h2
						id="confirm-modal-title"
						class="h4 m-0 text-surface-900 dark:text-surface-100"
					>
						{title}
					</h2>
				</div>
			</header>

			<!-- Message -->
			<p
				id="confirm-modal-description"
				class="text-sm text-surface-700 dark:text-surface-300 m-0"
			>
				{message}
			</p>

			<!-- Actions -->
			<footer class="flex gap-3 justify-end pt-2">
				<button
					type="button"
					class="btn variant-ghost-surface"
					onclick={handleCancel}
					aria-label="Cancel action"
				>
					{cancelText}
				</button>
				<button
					bind:this={confirmButton}
					type="button"
					class="btn {variantStyles}"
					onclick={handleConfirm}
					aria-label="Confirm action"
				>
					{confirmText}
				</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	/* Ensure modal is above everything */
	:global(body:has([role='dialog'])) {
		overflow: hidden;
	}

	/* Dark mode adjustments */
	:global(.dark) .card.variant-glass-surface {
		background: rgba(15, 23, 42, 0.95);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(148, 163, 184, 0.1);
	}
</style>
