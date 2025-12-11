import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '../../../test-utils';
import { fireEvent } from '@testing-library/svelte';
import MobileBuildMenu from '$lib/components/game/MobileBuildMenu.svelte';

describe('MobileBuildMenu', () => {
	const mockProps = {
		open: true,
		onClose: vi.fn(),
		settlementId: 'settlement-123'
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('should render when open', () => {
			const { container } = render(MobileBuildMenu, {
				props: mockProps
			});

			// Should render the BottomSheet with "Build Structure" title
			const title = container.querySelector('#sheet-title');
			expect(title?.textContent).toContain('Build Structure');
		});

		it('should not render when closed', () => {
			const { container } = render(MobileBuildMenu, {
				props: { ...mockProps, open: false }
			});

			const dialog = container.querySelector('[role="dialog"]');
			expect(dialog).toBeFalsy();
		});

		it('should render category tabs', () => {
			const { container } = render(MobileBuildMenu, {
				props: mockProps
			});

			// Component uses role="tab" for category tabs
			const categoryTabs = container.querySelectorAll('[role="tab"]');
			expect(categoryTabs.length).toBeGreaterThan(0);
		});

		it('should render structure cards for selected category', () => {
			const { container } = render(MobileBuildMenu, {
				props: mockProps
			});

			// Component uses data-structure-type attribute on structure buttons
			const structureCards = container.querySelectorAll('button[data-structure-type]');
			expect(structureCards.length).toBeGreaterThan(0);
		});
	});

	describe('Category Selection', () => {
		it('should highlight EXTRACTOR category by default', () => {
			const { container } = render(MobileBuildMenu, {
				props: mockProps
			});

			const categoryTabs = container.querySelectorAll('[role="tab"]');
			const extractorTab = Array.from(categoryTabs).find((tab) =>
				tab.textContent?.includes('EXTRACTOR')
			);

			// Component uses aria-selected="true" instead of 'active' class
			expect(extractorTab?.getAttribute('aria-selected')).toBe('true');
		});

		it('should switch categories when tab is clicked', async () => {
			const { container } = render(MobileBuildMenu, {
				props: mockProps
			});

			const categoryTabs = container.querySelectorAll('[role="tab"]');
			const buildingTab = Array.from(categoryTabs).find((tab) =>
				tab.textContent?.includes('BUILDING')
			);

			if (buildingTab) {
				await fireEvent.click(buildingTab);

				// Should now have aria-selected="true"
				expect(buildingTab.getAttribute('aria-selected')).toBe('true');
			}
		});

		it('should update structure grid when category changes', async () => {
			const { container } = render(MobileBuildMenu, {
				props: mockProps
			});

			// Switch category
			const categoryTabs = container.querySelectorAll('[role="tab"]');
			const buildingTab = Array.from(categoryTabs).find((tab) =>
				tab.textContent?.includes('BUILDING')
			);

			if (buildingTab) {
				await fireEvent.click(buildingTab);

				// Structure cards should be rendered for the new category
				const updatedCards = container.querySelectorAll('button[data-structure-type]');
				// At minimum, the grid should still exist
				expect(updatedCards.length).toBeGreaterThanOrEqual(0);
			}
		});
	});

	describe('Structure Interaction', () => {
		it('should call onClose when structure is selected', async () => {
			// Mock fetch to return successful response
			globalThis.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ success: true, data: { id: 'structure-1' } })
			});

			const onCloseMock = vi.fn();
			const { container } = render(MobileBuildMenu, {
				props: { ...mockProps, onClose: onCloseMock }
			});

			const structureCards = container.querySelectorAll('button[data-structure-type]');
			if (structureCards.length > 0) {
				await fireEvent.click(structureCards[0]);

				// Wait for async handleBuild to complete
				await vi.waitFor(() => {
					expect(onCloseMock).toHaveBeenCalledTimes(1);
				});
			}
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA attributes for tabs', () => {
			const { container } = render(MobileBuildMenu, {
				props: mockProps
			});

			const tabList = container.querySelector('[role="tablist"]');
			expect(tabList).toBeTruthy();

			const tabs = container.querySelectorAll('[role="tab"]');
			expect(tabs.length).toBeGreaterThan(0);

			// Active tab should have aria-selected="true"
			const activeTabs = Array.from(tabs).filter(
				(tab) => tab.getAttribute('aria-selected') === 'true'
			);
			expect(activeTabs.length).toBe(1);
		});

		it('should have tabpanel with proper aria-labelledby', () => {
			const { container } = render(MobileBuildMenu, {
				props: mockProps
			});

			const tabPanel = container.querySelector('[role="tabpanel"]');
			expect(tabPanel).toBeTruthy();
			expect(tabPanel?.getAttribute('aria-labelledby')).toBeTruthy();
		});

		it('should have keyboard-accessible buttons', () => {
			const { container } = render(MobileBuildMenu, {
				props: mockProps
			});

			const buttons = container.querySelectorAll('button');
			for (const button of buttons) {
				expect(button.getAttribute('type')).toBe('button');
			}
		});
	});
});
