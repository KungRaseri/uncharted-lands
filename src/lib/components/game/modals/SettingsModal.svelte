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
	import type { PanelId } from '$lib/stores/ui/dashboard-layout.svelte';
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
				layoutStore.hidePanel(panelId as PanelId);
			} else {
				layoutStore.showPanel(panelId as PanelId);
			}
		}
	}

	function handlePanelReorder(panelId: string, newPosition: number) {
		layoutStore.reorderPanel(panelId as PanelId, newPosition);
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
		<div class="flex flex-col gap-8 p-4">
			<!-- Preset Selector Section -->
			<section class="flex flex-col gap-3">
				<h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50 m-0">
					Layout Preset
				</h3>
				<p class="text-sm text-surface-600 dark:text-surface-400 m-0">
					Choose a pre-configured layout optimized for different tasks.
				</p>
				<LayoutPresetSelector
					currentPreset={currentLayout.layoutName}
					onPresetChange={handlePresetChange}
				/>
			</section>

			<!-- Panel Visibility Section -->
			<section class="flex flex-col gap-3">
				<h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50 m-0">
					Panel Visibility
				</h3>
				<p class="text-sm text-surface-600 dark:text-surface-400 m-0">
					Show or hide dashboard panels.
				</p>
				<div class="flex flex-col gap-2">
					{#each panels as panel (panel.id)}
						<label
							class="flex items-center gap-3 p-3 bg-surface-100 dark:bg-surface-800 rounded-lg cursor-pointer transition-colors duration-200 min-h-[44px] hover:bg-surface-200 dark:hover:bg-surface-700"
						>
							<input
								type="checkbox"
								checked={panel.visible}
								onchange={() => handlePanelVisibilityToggle(panel.id)}
								aria-label={`Toggle ${PANEL_NAMES[panel.id]} panel`}
								class="w-5 h-5 cursor-pointer m-0"
							/>
							<span class="text-[0.9375rem] text-surface-900 dark:text-surface-50 flex-1"
								>{PANEL_NAMES[panel.id]}</span
							>
						</label>
					{/each}
				</div>
			</section>

			<!-- Panel Order Section -->
			<section class="flex flex-col gap-3">
				<h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50 m-0">Panel Order</h3>
				<p class="text-sm text-surface-600 dark:text-surface-400 m-0">
					Drag to reorder panels, or use Up/Down arrow keys.
				</p>
				<DraggablePanelList {panels} panelNames={PANEL_NAMES} onReorder={handlePanelReorder} />
			</section>

			<!-- Actions Section -->
			<section class="flex gap-3 mt-4">
				<button
					type="button"
					class="flex-1 px-6 py-3 rounded-lg text-[0.9375rem] font-medium cursor-pointer transition-all duration-200 border-0 min-h-[44px] bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-50 hover:bg-surface-200 dark:hover:bg-surface-700 focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
					onclick={handleReset}
				>
					Reset to Default
				</button>
				<button
					type="button"
					class="flex-1 px-6 py-3 rounded-lg text-[0.9375rem] font-medium cursor-pointer transition-all duration-200 border-0 min-h-[44px] bg-primary-500 text-white hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
					onclick={onClose}
				>
					Save & Close
				</button>
			</section>
		</div>
	</BottomSheet>
{:else}
	<!-- Desktop/Tablet: Regular Modal -->
	{#if open}
		<div
			class="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4"
			onclick={onClose}
			role="presentation"
		>
			<div
				class="bg-surface-50 dark:bg-surface-900 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-[600px] w-full max-h-[90vh] flex flex-col overflow-hidden"
				tabindex="-1"
				role="dialog"
				aria-modal="true"
				aria-labelledby="settings-modal-title"
			>
				<!-- Modal Header -->
				<header
					class="flex items-center justify-between px-6 py-6 border-b border-surface-200 dark:border-surface-700"
				>
					<h2
						id="settings-modal-title"
						class="text-2xl font-semibold text-surface-900 dark:text-surface-50 m-0"
					>
						Dashboard Settings
					</h2>
					<button
						type="button"
						class="bg-transparent border-0 p-2 cursor-pointer text-surface-600 dark:text-surface-400 transition-colors duration-200 rounded hover:text-surface-900 dark:hover:text-surface-50 hover:bg-surface-100 dark:hover:bg-surface-800 focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
						onclick={onClose}
						aria-label="Close settings"
					>
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
				<div class="flex-1 overflow-y-auto p-0">
					<div class="flex flex-col gap-8 p-4">
						<!-- Preset Selector Section -->
						<section class="flex flex-col gap-3">
							<h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50 m-0">
								Layout Preset
							</h3>
							<p class="text-sm text-surface-600 dark:text-surface-400 m-0">
								Choose a pre-configured layout optimized for different tasks.
							</p>
							<LayoutPresetSelector
								currentPreset={currentLayout.layoutName}
								onPresetChange={handlePresetChange}
							/>
						</section>

						<!-- Panel Visibility Section -->
						<section class="flex flex-col gap-3">
							<h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50 m-0">
								Panel Visibility
							</h3>
							<p class="text-sm text-surface-600 dark:text-surface-400 m-0">
								Show or hide dashboard panels.
							</p>
							<div class="flex flex-col gap-2">
								{#each panels as panel (panel.id)}
									<label
										class="flex items-center gap-3 p-3 bg-surface-100 dark:bg-surface-800 rounded-lg cursor-pointer transition-colors duration-200 min-h-11 hover:bg-surface-200 dark:hover:bg-surface-700"
									>
										<input
											type="checkbox"
											class="w-5 h-5 cursor-pointer m-0"
											checked={panel.visible}
											onchange={() => handlePanelVisibilityToggle(panel.id)}
											aria-label={`Toggle ${PANEL_NAMES[panel.id]} panel`}
										/>
										<span class="text-[0.9375rem] text-surface-900 dark:text-surface-50 flex-1"
											>{PANEL_NAMES[panel.id]}</span
										>
									</label>
								{/each}
							</div>
						</section>

						<!-- Panel Order Section -->
						<section class="flex flex-col gap-3">
							<h3 class="text-lg font-semibold text-surface-900 dark:text-surface-50 m-0">
								Panel Order
							</h3>
							<p class="text-sm text-surface-600 dark:text-surface-400 m-0">
								Drag to reorder panels, or use Up/Down arrow keys.
							</p>
							<DraggablePanelList
								{panels}
								panelNames={PANEL_NAMES}
								onReorder={handlePanelReorder}
							/>
						</section>
					</div>
				</div>

				<!-- Modal Footer -->
				<footer
					class="flex gap-3 px-6 py-6 border-t border-surface-200 dark:border-surface-700 justify-end"
				>
					<button
						type="button"
						class="px-6 py-3 rounded-lg text-[0.9375rem] font-medium cursor-pointer transition-all duration-200 border-0 min-h-11 bg-surface-100 dark:bg-surface-800 text-surface-900 dark:text-surface-50 hover:bg-surface-200 dark:hover:bg-surface-700 focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
						onclick={handleReset}
					>
						Reset to Default
					</button>
					<button
						type="button"
						class="px-6 py-3 rounded-lg text-[0.9375rem] font-medium cursor-pointer transition-all duration-200 border-0 min-h-11 bg-primary-500 text-white hover:bg-primary-600 focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
						onclick={onClose}
					>
						Save & Close
					</button>
				</footer>
			</div>
		</div>
	{/if}
{/if}
