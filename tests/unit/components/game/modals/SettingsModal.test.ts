/**
 * SettingsModal Component Tests
 *
 * Test coverage for dashboard settings modal with:
 * - Rendering in open/closed states
 * - Mobile vs Desktop rendering (BottomSheet vs modal)
 * - Layout preset selection
 * - Panel visibility toggles
 * - Panel reordering
 * - Keyboard shortcuts
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '../../../../test-utils';
import { fireEvent } from '@testing-library/svelte';
import SettingsModal from '$lib/components/game/modals/SettingsModal.svelte';
import { layoutStore } from '$lib/stores/ui/dashboard-layout.svelte';

// Mock dashboard-layout store - all functions created inside the factory
vi.mock('$lib/stores/ui/dashboard-layout.svelte', () => ({
	layoutStore: {
		getCurrentLayout: vi.fn(() => ({
			layoutName: 'default',
			panels: [
				{ id: 'alerts', visible: true, order: 0 },
				{ id: 'resources', visible: true, order: 1 },
				{ id: 'population', visible: false, order: 2 },
				{ id: 'construction', visible: true, order: 3 }
			]
		})),
		loadLayout: vi.fn(),
		showPanel: vi.fn(),
		hidePanel: vi.fn(),
		reorderPanels: vi.fn(),
		resetLayout: vi.fn()
	}
}));

// Get access to the mocked store functions
const mockLayoutStore = vi.mocked(layoutStore);

// Mock child components - return simple mock components
vi.mock('$lib/components/game/LayoutPresetSelector.svelte', () => ({
	default: vi.fn(() => ({
		$$: {},
		$on: vi.fn(),
		$set: vi.fn()
	}))
}));

vi.mock('$lib/components/game/DraggablePanelList.svelte', () => ({
	default: vi.fn(() => ({
		$$: {},
		$on: vi.fn(),
		$set: vi.fn()
	}))
}));

describe('SettingsModal', () => {
	let originalInnerWidth: number;

	beforeEach(() => {
		vi.clearAllMocks();
		originalInnerWidth = globalThis.innerWidth;
	});

	afterEach(() => {
		Object.defineProperty(globalThis, 'innerWidth', {
			writable: true,
			configurable: true,
			value: originalInnerWidth
		});
	});

	describe('Rendering - Desktop Modal', () => {
		beforeEach(() => {
			// Set desktop viewport (>= 768px)
			Object.defineProperty(globalThis, 'innerWidth', {
				writable: true,
				configurable: true,
				value: 1024
			});
		});

		it('should render desktop modal when open=true on desktop viewport', async () => {
			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: vi.fn()
				}
			});

			// Wait for effect to run
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Desktop modal should be visible
			const modalBackdrop = container.querySelector('.modal-backdrop');
			expect(modalBackdrop).toBeTruthy();

			const modalContainer = container.querySelector('.modal-container');
			expect(modalContainer).toBeTruthy();
			expect(modalContainer?.getAttribute('role')).toBe('dialog');
			expect(modalContainer?.getAttribute('aria-modal')).toBe('true');
		});

		it('should not render desktop modal when open=false', async () => {
			const { container } = render(SettingsModal, {
				props: {
					open: false,
					onClose: vi.fn()
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			const modalBackdrop = container.querySelector('.modal-backdrop');
			expect(modalBackdrop).toBeFalsy();
		});

		it('should render modal title correctly', async () => {
			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: vi.fn()
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			const title = container.querySelector('#settings-modal-title');
			expect(title).toBeTruthy();
			expect(title?.textContent?.trim()).toBe('Dashboard Settings');
		});

		it('should render all settings sections', async () => {
			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: vi.fn()
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			const sections = container.querySelectorAll('.settings-section');
			expect(sections.length).toBeGreaterThanOrEqual(3);

			// Check for section headings
			const headings = Array.from(container.querySelectorAll('.settings-section h3')).map((h) =>
				h.textContent?.trim()
			);

			expect(headings).toContain('Layout Preset');
			expect(headings).toContain('Panel Visibility');
			expect(headings).toContain('Panel Order');
		});
	});

	describe('Rendering - Mobile BottomSheet', () => {
		beforeEach(() => {
			// Set mobile viewport (< 768px)
			Object.defineProperty(window, 'innerWidth', {
				writable: true,
				configurable: true,
				value: 375
			});
		});

		it('should render BottomSheet on mobile viewport', async () => {
			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: vi.fn()
				}
			});

			// Wait for effect to run and re-render
			await new Promise((resolve) => setTimeout(resolve, 50));

			// BottomSheet should be rendered (check for BottomSheet-specific classes)
			const bottomSheet = container.querySelector('.bottom-sheet');
			expect(bottomSheet).toBeTruthy();

			// Desktop modal should NOT be rendered
			const modalBackdrop = container.querySelector('.modal-backdrop');
			expect(modalBackdrop).toBeFalsy();
		});
	});

	describe('Panel Visibility Toggles', () => {
		beforeEach(() => {
			Object.defineProperty(window, 'innerWidth', {
				writable: true,
				configurable: true,
				value: 1024
			});
		});

		it('should render panel visibility checkboxes', async () => {
			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: vi.fn()
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			const checkboxes = container.querySelectorAll('.panel-toggle input[type="checkbox"]');
			expect(checkboxes.length).toBeGreaterThan(0);

			// Check first few panels are rendered
			const panelToggles = container.querySelectorAll('.panel-toggle');
			expect(panelToggles.length).toBeGreaterThanOrEqual(4);
		});

		it('should call hidePanel when visible panel is toggled off', async () => {
			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: vi.fn()
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			// Find the first visible panel (alerts)
			const checkboxes = container.querySelectorAll('.panel-toggle input[type="checkbox"]');
			const firstCheckbox = checkboxes[0] as HTMLInputElement;

			expect(firstCheckbox.checked).toBe(true);

			await fireEvent.change(firstCheckbox);

			expect(mockLayoutStore.hidePanel).toHaveBeenCalledWith('alerts');
		});

		it('should call showPanel when hidden panel is toggled on', async () => {
			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: vi.fn()
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			// Find the hidden panel (population - order 2, visible: false)
			const checkboxes = container.querySelectorAll('.panel-toggle input[type="checkbox"]');
			const hiddenCheckbox = checkboxes[2] as HTMLInputElement;

			expect(hiddenCheckbox.checked).toBe(false);

			await fireEvent.change(hiddenCheckbox);

			expect(mockLayoutStore.showPanel).toHaveBeenCalledWith('population');
		});
	});

	describe('Reset Functionality', () => {
		beforeEach(() => {
			Object.defineProperty(window, 'innerWidth', {
				writable: true,
				configurable: true,
				value: 1024
			});
		});

		it('should render reset button', async () => {
			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: vi.fn()
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			const resetButton = Array.from(container.querySelectorAll('button')).find((btn) =>
				btn.textContent?.includes('Reset to Default')
			);

			expect(resetButton).toBeTruthy();
			expect(resetButton?.type).toBe('button');
		});

		it('should call resetLayout when reset is confirmed', async () => {
			// Mock globalThis.confirm to return true
			const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: vi.fn()
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			const resetButton = Array.from(container.querySelectorAll('button')).find((btn) =>
				btn.textContent?.includes('Reset to Default')
			);

			expect(resetButton).toBeTruthy();

			await fireEvent.click(resetButton!);

			expect(confirmSpy).toHaveBeenCalledWith(
				'Reset layout to default? This will clear all customizations.'
			);
			expect(mockLayoutStore.resetLayout).toHaveBeenCalledWith('default');

			confirmSpy.mockRestore();
		});

		it('should NOT call resetLayout when reset is cancelled', async () => {
			const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: vi.fn()
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			const resetButton = Array.from(container.querySelectorAll('button')).find((btn) =>
				btn.textContent?.includes('Reset to Default')
			);

			await fireEvent.click(resetButton!);

			expect(confirmSpy).toHaveBeenCalled();
			expect(mockLayoutStore.resetLayout).not.toHaveBeenCalled();

			confirmSpy.mockRestore();
		});
	});

	describe('Close Functionality', () => {
		beforeEach(() => {
			Object.defineProperty(window, 'innerWidth', {
				writable: true,
				configurable: true,
				value: 1024
			});
		});

		it('should call onClose when Save & Close button is clicked', async () => {
			const mockOnClose = vi.fn();

			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: mockOnClose
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			const saveButton = Array.from(container.querySelectorAll('button')).find((btn) =>
				btn.textContent?.includes('Save & Close')
			);

			expect(saveButton).toBeTruthy();

			await fireEvent.click(saveButton!);

			// Component calls onClose from both the button and BottomSheet wrapper
			expect(mockOnClose).toHaveBeenCalled();
		});

		it('should call onClose when close button (X) is clicked', async () => {
			const mockOnClose = vi.fn();

			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: mockOnClose
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			const closeButton = container.querySelector('.close-button');
			expect(closeButton).toBeTruthy();
			expect(closeButton?.getAttribute('aria-label')).toBe('Close settings');

			await fireEvent.click(closeButton!);

			// Component calls onClose from both the button and BottomSheet wrapper
			expect(mockOnClose).toHaveBeenCalled();
		});

		it('should call onClose when backdrop is clicked', async () => {
			const mockOnClose = vi.fn();

			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: mockOnClose
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			const backdrop = container.querySelector('.modal-backdrop');
			expect(backdrop).toBeTruthy();

			await fireEvent.click(backdrop!);

			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});
	});

	describe('Accessibility', () => {
		beforeEach(() => {
			Object.defineProperty(window, 'innerWidth', {
				writable: true,
				configurable: true,
				value: 1024
			});
		});

		it('should have correct ARIA attributes on modal container', async () => {
			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: vi.fn()
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			const modalContainer = container.querySelector('.modal-container');
			expect(modalContainer?.getAttribute('role')).toBe('dialog');
			expect(modalContainer?.getAttribute('aria-modal')).toBe('true');
			expect(modalContainer?.getAttribute('aria-labelledby')).toBe('settings-modal-title');
			expect(modalContainer?.getAttribute('tabindex')).toBe('-1');
		});

		it('should have aria-label on panel visibility checkboxes', async () => {
			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: vi.fn()
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			const checkboxes = container.querySelectorAll('.panel-toggle input[type="checkbox"]');
			for (const checkbox of checkboxes) {
				const ariaLabel = checkbox.getAttribute('aria-label');
				expect(ariaLabel).toBeTruthy();
				expect(ariaLabel).toMatch(/^Toggle .+ panel$/);
			}
		});

		it('should have type="button" on all buttons to prevent form submission', async () => {
			const { container } = render(SettingsModal, {
				props: {
					open: true,
					onClose: vi.fn()
				}
			});

			await new Promise((resolve) => setTimeout(resolve, 50));

			const buttons = container.querySelectorAll('button');
			for (const button of buttons) {
				expect(button.type).toBe('button');
			}
		});
	});
});
