import { describe, it, expect, vi } from 'vitest';
import { render } from '../../../test-utils';
import { fireEvent } from '@testing-library/svelte';
import DraggablePanelList from '$lib/components/game/DraggablePanelList.svelte';
import type { PanelConfig } from '$lib/stores/ui/dashboard-layout.svelte';

describe('DraggablePanelList', () => {
	const mockPanels: PanelConfig[] = [
		{ id: 'alerts', column: 'left', order: 0, visible: true, collapsed: false },
		{ id: 'resource-header', column: 'left', order: 1, visible: true, collapsed: false },
		{ id: 'population', column: 'left', order: 2, visible: false, collapsed: false },
		{ id: 'construction', column: 'left', order: 3, visible: true, collapsed: true }
	];

	const mockPanelNames = {
		alerts: 'Alerts',
		'resource-header': 'Resources',
		population: 'Population',
		construction: 'Construction Queue'
	};

	describe('Rendering', () => {
		it('should render all panels in order', () => {
			const mockOnReorder = vi.fn();
			const { container } = render(DraggablePanelList, {
				panels: mockPanels,
				panelNames: mockPanelNames,
				onReorder: mockOnReorder
			});

			const panelItems = container.querySelectorAll('[data-panel-id]');
			expect(panelItems).toHaveLength(4);

			// Verify panels are in position order by their aria-label
			const panelNames = Array.from(panelItems).map((item) => {
				const ariaLabel = item.getAttribute('aria-label') || '';
				return ariaLabel.split(',')[0]; // Get panel name from "PanelName, position X of Y..."
			});
			expect(panelNames).toEqual(['Alerts', 'Resources', 'Population', 'Construction Queue']);
		});

		it('should display panel positions', () => {
			const mockOnReorder = vi.fn();
			const { container } = render(DraggablePanelList, {
				panels: mockPanels,
				panelNames: mockPanelNames,
				onReorder: mockOnReorder
			});

			const panelItems = container.querySelectorAll('[data-panel-id]');
			const positions = Array.from(panelItems).map((item) => {
				// Find the position text within the panel
				const positionText = item.querySelector('.text-xs')?.textContent?.trim();
				return positionText;
			});
			expect(positions).toEqual(['Position 1', 'Position 2', 'Position 3', 'Position 4']);
		});

		it('should show status badges for hidden/collapsed panels', () => {
			const mockOnReorder = vi.fn();
			const { container } = render(DraggablePanelList, {
				panels: mockPanels,
				panelNames: mockPanelNames,
				onReorder: mockOnReorder
			});

			// Population panel is hidden (order 2)
			const panelItems = container.querySelectorAll('[data-panel-id]');
			const populationPanel = panelItems[2]; // order 2 (0-indexed)
			const hiddenBadge = populationPanel.querySelector('span[title="Hidden"]');
			expect(hiddenBadge?.textContent).toBe('Hidden');

			// Construction panel is collapsed (order 3)
			const constructionPanel = panelItems[3]; // order 3
			const collapsedBadge = constructionPanel.querySelector('span[title="Collapsed"]');
			expect(collapsedBadge?.textContent).toBe('Collapsed');
		});
	});

	describe('Keyboard Reordering', () => {
		it('should move panel up with ArrowUp key', async () => {
			const mockOnReorder = vi.fn();
			const { container } = render(DraggablePanelList, {
				panels: mockPanels,
				panelNames: mockPanelNames,
				onReorder: mockOnReorder
			});

			// Focus on Resources panel (order 1)
			const panelItems = container.querySelectorAll('[data-panel-id]');
			const resourcesPanel = panelItems[1] as HTMLElement;
			resourcesPanel.focus();

			// Press ArrowUp to move to order 0
			await fireEvent.keyDown(resourcesPanel, { key: 'ArrowUp' });

			expect(mockOnReorder).toHaveBeenCalledWith('resource-header', 0);
		});

		it('should move panel down with ArrowDown key', async () => {
			const mockOnReorder = vi.fn();
			const { container } = render(DraggablePanelList, {
				panels: mockPanels,
				panelNames: mockPanelNames,
				onReorder: mockOnReorder
			});

			// Focus on Alerts panel (order 0)
			const panelItems = container.querySelectorAll('[data-panel-id]');
			const alertsPanel = panelItems[0] as HTMLElement;
			alertsPanel.focus();

			// Press ArrowDown to move to order 1
			await fireEvent.keyDown(alertsPanel, { key: 'ArrowDown' });

			expect(mockOnReorder).toHaveBeenCalledWith('alerts', 1);
		});

		it('should move panel to top with Home key', async () => {
			const mockOnReorder = vi.fn();
			const { container } = render(DraggablePanelList, {
				panels: mockPanels,
				panelNames: mockPanelNames,
				onReorder: mockOnReorder
			});

			// Focus on Construction panel (order 3)
			const panelItems = container.querySelectorAll('[data-panel-id]');
			const constructionPanel = panelItems[3] as HTMLElement;
			constructionPanel.focus();

			// Press Home to move to order 0
			await fireEvent.keyDown(constructionPanel, { key: 'Home' });

			expect(mockOnReorder).toHaveBeenCalledWith('construction', 0);
		});

		it('should move panel to bottom with End key', async () => {
			const mockOnReorder = vi.fn();
			const { container } = render(DraggablePanelList, {
				panels: mockPanels,
				panelNames: mockPanelNames,
				onReorder: mockOnReorder
			});

			// Focus on Alerts panel (order 0)
			const panelItems = container.querySelectorAll('[data-panel-id]');
			const alertsPanel = panelItems[0] as HTMLElement;
			alertsPanel.focus();

			// Press End to move to last order (3)
			await fireEvent.keyDown(alertsPanel, { key: 'End' });

			expect(mockOnReorder).toHaveBeenCalledWith('alerts', 3);
		});
	});

	describe('Accessibility', () => {
		it('should have proper ARIA labels', () => {
			const mockOnReorder = vi.fn();
			const { container } = render(DraggablePanelList, {
				panels: mockPanels,
				panelNames: mockPanelNames,
				onReorder: mockOnReorder
			});

			// List has role and label
			const list = container.querySelector('[role="list"]');
			expect(list?.getAttribute('role')).toBe('list');
			expect(list?.getAttribute('aria-label')).toBe('Dashboard panels');

			// Panel items have descriptive ARIA labels
			const panelItems = container.querySelectorAll('[data-panel-id]');
			const alertsPanel = panelItems[0];
			const ariaLabel = alertsPanel.getAttribute('aria-label');
			expect(ariaLabel).toContain('Alerts');
			expect(ariaLabel).toContain('position 1 of 4');
			expect(ariaLabel).toContain('Use arrow keys to reorder');
		});

		it('should be keyboard navigable', () => {
			const mockOnReorder = vi.fn();
			const { container } = render(DraggablePanelList, {
				panels: mockPanels,
				panelNames: mockPanelNames,
				onReorder: mockOnReorder
			});

			// All panel items should be focusable
			const panelItems = container.querySelectorAll('[data-panel-id]');
			for (const item of panelItems) {
				expect(item.getAttribute('tabindex')).toBe('0');
			}
		});
	});
});
