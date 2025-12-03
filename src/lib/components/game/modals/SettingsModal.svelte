<script lang="ts">
	/**
	 * Settings Modal Component
	 *
	 * Customization interface for dashboard layout with:
	 * - Layout preset selection
	 * - Panel visibility toggles
	 * - Panel reordering (drag or keyboard)
	 * - Responsive: BottomSheet on mobile, modal on desktop
	 */

	import { browser } from '$app/environment';
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import { layoutStore } from '$lib/stores/ui/dashboard-layout.svelte';
	import LayoutPresetSelector from '../LayoutPresetSelector.svelte';
	import DraggablePanelList from '../DraggablePanelList.svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open = $bindable(false), onClose }: Props = $props();

	// Viewport detection
	let isMobile = $state(false);

	$effect(() => {
		if (browser) {
			const checkViewport = () => {
				isMobile = window.innerWidth < 768;
			};
			checkViewport();
			window.addEventListener('resize', checkViewport);
			return () => window.removeEventListener('resize', checkViewport);
		}
	});

	// Layout state
	const currentLayout = $derived(layoutStore.getCurrentLayout());
	const panels = $derived(currentLayout.panels);

	// Panel display names
	const PANEL_NAMES: Record<string, string> = {
		alerts: 'Alerts & Warnings',
		resources: 'Resource Management',
		population: 'Population Stats',
		construction: 'Construction Queue',
		structures: 'Structure Overview',
		trade: 'Trade & Markets',
		diplomacy: 'Diplomacy & Relations'
	};

	// Handlers
	function handlePresetChange(presetName: string) {
		layoutStore.loadLayout(presetName);
	}

	function handlePanelVisibilityToggle(panelId: string) {
		const panel = panels.find((p) => p.id === panelId);
		if (panel) {
			if (panel.visible) {
				layoutStore.hidePanel(panelId);
			} else {
				layoutStore.showPanel(panelId);
			}
		}
	}

	function handlePanelReorder(panelId: string, newPosition: number) {
		layoutStore.reorderPanels(panelId, newPosition);
	}

	function handleReset() {
		if (confirm('Reset layout to default? This will clear all customizations.')) {
			layoutStore.resetLayout('default');
		}
	}

	// Keyboard shortcuts
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			handleReset();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isMobile}
	<!-- Mobile: Use BottomSheet -->
	<BottomSheet {open} {onClose} title="Dashboard Settings" height="full">
		<div class="settings-content">
			<!-- Preset Selector Section -->
			<section class="settings-section">
				<h3>Layout Preset</h3>
				<p class="settings-description">
					Choose a pre-configured layout optimized for different tasks.
				</p>
				<LayoutPresetSelector
					currentPreset={currentLayout.layoutName}
					onPresetChange={handlePresetChange}
				/>
			</section>

			<!-- Panel Visibility Section -->
			<section class="settings-section">
				<h3>Panel Visibility</h3>
				<p class="settings-description">Show or hide dashboard panels.</p>
				<div class="panel-toggles">
					{#each panels as panel (panel.id)}
						<label class="panel-toggle">
							<input
								type="checkbox"
								checked={panel.visible}
								onchange={() => handlePanelVisibilityToggle(panel.id)}
								aria-label={`Toggle ${PANEL_NAMES[panel.id]} panel`}
							/>
							<span class="panel-name">{PANEL_NAMES[panel.id]}</span>
						</label>
					{/each}
				</div>
			</section>

			<!-- Panel Order Section -->
			<section class="settings-section">
				<h3>Panel Order</h3>
				<p class="settings-description">Drag to reorder panels, or use Up/Down arrow keys.</p>
				<DraggablePanelList {panels} panelNames={PANEL_NAMES} onReorder={handlePanelReorder} />
			</section>

			<!-- Actions Section -->
			<section class="settings-section settings-actions">
				<button type="button" class="btn btn-secondary" onclick={handleReset}>
					Reset to Default
				</button>
				<button type="button" class="btn btn-primary" onclick={onClose}> Save & Close </button>
			</section>
		</div>
	</BottomSheet>
{:else}
	<!-- Desktop/Tablet: Regular Modal -->
	{#if open}
		<div class="modal-backdrop" onclick={onClose} role="presentation">
			<div
				class="modal-container"
				tabindex="-1"
				role="dialog"
				aria-modal="true"
				aria-labelledby="settings-modal-title"
			>
				<!-- Modal Header -->
				<header class="modal-header">
					<h2 id="settings-modal-title">Dashboard Settings</h2>
					<button type="button" class="close-button" onclick={onClose} aria-label="Close settings">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M18 6L6 18M6 6l12 12" />
						</svg>
					</button>
				</header>

				<!-- Modal Body -->
				<div class="modal-body">
					<div class="settings-content">
						<!-- Preset Selector Section -->
						<section class="settings-section">
							<h3>Layout Preset</h3>
							<p class="settings-description">
								Choose a pre-configured layout optimized for different tasks.
							</p>
							<LayoutPresetSelector
								currentPreset={currentLayout.layoutName}
								onPresetChange={handlePresetChange}
							/>
						</section>

						<!-- Panel Visibility Section -->
						<section class="settings-section">
							<h3>Panel Visibility</h3>
							<p class="settings-description">Show or hide dashboard panels.</p>
							<div class="panel-toggles">
								{#each panels as panel (panel.id)}
									<label class="panel-toggle">
										<input
											type="checkbox"
											checked={panel.visible}
											onchange={() => handlePanelVisibilityToggle(panel.id)}
											aria-label={`Toggle ${PANEL_NAMES[panel.id]} panel`}
										/>
										<span class="panel-name">{PANEL_NAMES[panel.id]}</span>
									</label>
								{/each}
							</div>
						</section>

						<!-- Panel Order Section -->
						<section class="settings-section">
							<h3>Panel Order</h3>
							<p class="settings-description">Drag to reorder panels, or use Up/Down arrow keys.</p>
							<DraggablePanelList
								{panels}
								panelNames={PANEL_NAMES}
								onReorder={handlePanelReorder}
							/>
						</section>
					</div>
				</div>

				<!-- Modal Footer -->
				<footer class="modal-footer">
					<button type="button" class="btn btn-secondary" onclick={handleReset}>
						Reset to Default
					</button>
					<button type="button" class="btn btn-primary" onclick={onClose}> Save & Close </button>
				</footer>
			</div>
		</div>
	{/if}
{/if}

<style>
	/* Settings Content */
	.settings-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		padding: 1rem;
	}

	.settings-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.settings-section h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-primary, #1a1a1a);
		margin: 0;
	}

	.settings-description {
		font-size: 0.875rem;
		color: var(--color-text-secondary, #666);
		margin: 0;
	}

	/* Panel Toggles */
	.panel-toggles {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.panel-toggle {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--color-surface-secondary, #f5f5f5);
		border-radius: 0.5rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
		min-height: 44px; /* Touch target */
	}

	.panel-toggle:hover {
		background: var(--color-surface-tertiary, #e0e0e0);
	}

	.panel-toggle input[type='checkbox'] {
		width: 20px;
		height: 20px;
		cursor: pointer;
		margin: 0;
	}

	.panel-name {
		font-size: 0.9375rem;
		color: var(--color-text-primary, #1a1a1a);
		flex: 1;
	}

	/* Settings Actions */
	.settings-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.settings-actions button {
		flex: 1;
	}

	/* Modal Backdrop (Desktop) */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 1rem;
	}

	/* Modal Container (Desktop) */
	.modal-container {
		background: var(--color-surface-primary, #ffffff);
		border-radius: 1rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Modal Header */
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.5rem;
		border-bottom: 1px solid var(--color-border, #e0e0e0);
	}

	.modal-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-text-primary, #1a1a1a);
		margin: 0;
	}

	.close-button {
		background: none;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		color: var(--color-text-secondary, #666);
		transition: color 0.2s ease;
		border-radius: 0.25rem;
	}

	.close-button:hover {
		color: var(--color-text-primary, #1a1a1a);
		background: var(--color-surface-secondary, #f5f5f5);
	}

	.close-button:focus-visible {
		outline: 2px solid var(--color-primary-500, #3b82f6);
		outline-offset: 2px;
	}

	/* Modal Body */
	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 0;
	}

	/* Modal Footer */
	.modal-footer {
		display: flex;
		gap: 0.75rem;
		padding: 1.5rem;
		border-top: 1px solid var(--color-border, #e0e0e0);
		justify-content: flex-end;
	}

	/* Buttons */
	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		min-height: 44px; /* Touch target */
	}

	.btn-primary {
		background: var(--color-primary-500, #3b82f6);
		color: white;
	}

	.btn-primary:hover {
		background: var(--color-primary-600, #2563eb);
	}

	.btn-secondary {
		background: var(--color-surface-secondary, #f5f5f5);
		color: var(--color-text-primary, #1a1a1a);
	}

	.btn-secondary:hover {
		background: var(--color-surface-tertiary, #e0e0e0);
	}

	.btn:focus-visible {
		outline: 2px solid var(--color-primary-500, #3b82f6);
		outline-offset: 2px;
	}

	/* Dark Mode Support */
	:global(.dark) .settings-section h3,
	:global(.dark) .modal-header h2,
	:global(.dark) .panel-name {
		color: var(--color-text-primary-dark, #f5f5f5);
	}

	:global(.dark) .settings-description {
		color: var(--color-text-secondary-dark, #a0a0a0);
	}

	:global(.dark) .panel-toggle {
		background: var(--color-surface-secondary-dark, #2a2a2a);
	}

	:global(.dark) .panel-toggle:hover {
		background: var(--color-surface-tertiary-dark, #3a3a3a);
	}

	:global(.dark) .modal-container {
		background: var(--color-surface-primary-dark, #1a1a1a);
	}

	:global(.dark) .modal-header {
		border-bottom-color: var(--color-border-dark, #3a3a3a);
	}

	:global(.dark) .modal-footer {
		border-top-color: var(--color-border-dark, #3a3a3a);
	}

	:global(.dark) .close-button {
		color: var(--color-text-secondary-dark, #a0a0a0);
	}

	:global(.dark) .close-button:hover {
		color: var(--color-text-primary-dark, #f5f5f5);
		background: var(--color-surface-secondary-dark, #2a2a2a);
	}

	:global(.dark) .btn-secondary {
		background: var(--color-surface-secondary-dark, #2a2a2a);
		color: var(--color-text-primary-dark, #f5f5f5);
	}

	:global(.dark) .btn-secondary:hover {
		background: var(--color-surface-tertiary-dark, #3a3a3a);
	}

	/* Responsive adjustments */
	@media (max-width: 767px) {
		.modal-container {
			max-width: 100%;
			border-radius: 1rem 1rem 0 0;
			max-height: 95vh;
		}

		.settings-content {
			padding: 0.5rem;
		}
	}
</style>
