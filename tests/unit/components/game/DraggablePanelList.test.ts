import { describe, it, expect, vi } from 'vitest';
import { render } from '../../../test-utils';
import { fireEvent } from '@testing-library/svelte';
import DraggablePanelList from '$lib/components/game/DraggablePanelList.svelte';
import type { PanelConfig } from '$lib/stores/ui/dashboard-layout.svelte';

describe('DraggablePanelList', () => {
	const mockPanels: PanelConfig[] = [
		{ id: 'alerts', visible: true, collapsed: false, position: 0, size: 'medium' },
		{ id: 'resources', visible: true, collapsed: false, position: 1, size: 'large' },
		{ id: 'population', visible: false, collapsed: false, position: 2, size: 'medium' },
		{ id: 'construction', visible: true, collapsed: true, position: 3, size: 'medium' }
	];

	const mockPanelNames = {
		alerts: 'Alerts',
		resources: 'Resources',
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

			const panelItems = container.querySelectorAll('.panel-item');
			expect(panelItems).toHaveLength(4);

			// Verify panels are in position order
			const panelNames = Array.from(panelItems).map(
				(item) => item.querySelector('.panel-name')?.textContent
			);
			expect(panelNames).toEqual(['Alerts', 'Resources', 'Population', 'Construction Queue']);
		});

		it('should display panel positions', () => {
			const mockOnReorder = vi.fn();
			const { container } = render(DraggablePanelList, {
				panels: mockPanels,
				panelNames: mockPanelNames,
				onReorder: mockOnReorder
			});

			const positions = Array.from(container.querySelectorAll('.panel-position')).map(
				(el) => el.textContent
			);
			expect(positions).toEqual(['Position 1', 'Position 2', 'Position 3', 'Position 4']);
		});

		it('should show status badges for hidden/collapsed panels', () => {
			const mockOnReorder = vi.fn();
			const { container } = render(DraggablePanelList, {
				panels: mockPanels,
				panelNames: mockPanelNames,
				onReorder: mockOnReorder
			});

			// Population panel is hidden
			const panelItems = container.querySelectorAll('.panel-item');
			const populationPanel = panelItems[2]; // Position 2 (0-indexed)
			const hiddenBadge = populationPanel.querySelector('.status-badge.hidden');
			expect(hiddenBadge?.textContent).toBe('Hidden');

			// Construction panel is collapsed
			const constructionPanel = panelItems[3]; // Position 3
			const collapsedBadge = constructionPanel.querySelector('.status-badge.collapsed');
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

			// Focus on Resources panel (position 1)
			const panelItems = container.querySelectorAll('.panel-item');
			const resourcesPanel = panelItems[1] as HTMLElement;
			resourcesPanel.focus();

			// Press ArrowUp to move to position 0
			await fireEvent.keyDown(resourcesPanel, { key: 'ArrowUp' });

			expect(mockOnReorder).toHaveBeenCalledWith('resources', 0);
		});

		it('should move panel down with ArrowDown key', async () => {
			const mockOnReorder = vi.fn();
			const { container } = render(DraggablePanelList, {
				panels: mockPanels,
				panelNames: mockPanelNames,
				onReorder: mockOnReorder
			});

			// Focus on Alerts panel (position 0)
			const panelItems = container.querySelectorAll('.panel-item');
			const alertsPanel = panelItems[0] as HTMLElement;
			alertsPanel.focus();

			// Press ArrowDown to move to position 1
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

			// Focus on Construction panel (position 3)
			const panelItems = container.querySelectorAll('.panel-item');
			const constructionPanel = panelItems[3] as HTMLElement;
			constructionPanel.focus();

			// Press Home to move to position 0
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

			// Focus on Alerts panel (position 0)
			const panelItems = container.querySelectorAll('.panel-item');
			const alertsPanel = panelItems[0] as HTMLElement;
			alertsPanel.focus();

			// Press End to move to last position (3)
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
			const list = container.querySelector('.panel-list');
			expect(list?.getAttribute('role')).toBe('list');
			expect(list?.getAttribute('aria-label')).toBe('Dashboard panels');

			// Panel items have descriptive ARIA labels
			const panelItems = container.querySelectorAll('.panel-item');
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
			const panelItems = container.querySelectorAll('.panel-item');
			for (const item of panelItems) {
				expect(item.getAttribute('tabindex')).toBe('0');
			}
		});
	});
});
