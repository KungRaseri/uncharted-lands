/**
 * Dashboard Layout Store
 *
 * Manages customizable dashboard layouts with:
 * - Panel visibility/order
 * - Panel sizes (small/medium/large)
 * - Viewport detection (mobile/tablet/desktop)
 * - Layout persistence (localStorage)
 * - Preset layouts
 */

import { browser } from '$app/environment';

export interface PanelConfig {
	id: string;
	position: number;
	size: 'small' | 'medium' | 'large';
	visible: boolean;
	collapsed: boolean;
}

export interface DashboardLayout {
	layoutName: string;
	panels: PanelConfig[];
	quickActions: string[];
	theme: 'light' | 'dark' | 'auto';
}

export type Viewport = 'mobile' | 'tablet' | 'desktop';

// Default layouts
const DEFAULT_LAYOUTS: Record<string, DashboardLayout> = {
	default: {
		layoutName: 'Default',
		panels: [
			{ id: 'alerts', position: 0, size: 'medium', visible: true, collapsed: false },
			{ id: 'resources', position: 1, size: 'large', visible: true, collapsed: false },
			{ id: 'population', position: 2, size: 'medium', visible: true, collapsed: false },
			{ id: 'construction', position: 3, size: 'medium', visible: true, collapsed: false },
			{ id: 'structures', position: 4, size: 'large', visible: true, collapsed: false },
			{ id: 'trade', position: 5, size: 'small', visible: false, collapsed: true },
			{ id: 'diplomacy', position: 6, size: 'small', visible: false, collapsed: true }
		],
		quickActions: ['build', 'collect', 'upgrade', 'repair', 'aid'],
		theme: 'auto'
	},

	planning: {
		layoutName: 'Planning Mode',
		panels: [
			{ id: 'resources', position: 0, size: 'large', visible: true, collapsed: false },
			{ id: 'construction', position: 1, size: 'large', visible: true, collapsed: false },
			{ id: 'structures', position: 2, size: 'large', visible: true, collapsed: false },
			{ id: 'population', position: 3, size: 'small', visible: true, collapsed: true },
			{ id: 'alerts', position: 4, size: 'small', visible: true, collapsed: true },
			{ id: 'trade', position: 5, size: 'small', visible: false, collapsed: true },
			{ id: 'diplomacy', position: 6, size: 'small', visible: false, collapsed: true }
		],
		quickActions: ['build', 'upgrade', 'collect'],
		theme: 'auto'
	},

	combat: {
		layoutName: 'Disaster Response',
		panels: [
			{ id: 'alerts', position: 0, size: 'large', visible: true, collapsed: false },
			{ id: 'population', position: 1, size: 'large', visible: true, collapsed: false },
			{ id: 'resources', position: 2, size: 'medium', visible: true, collapsed: false },
			{ id: 'structures', position: 3, size: 'medium', visible: true, collapsed: false },
			{ id: 'construction', position: 4, size: 'small', visible: true, collapsed: true },
			{ id: 'trade', position: 5, size: 'small', visible: false, collapsed: true },
			{ id: 'diplomacy', position: 6, size: 'small', visible: false, collapsed: true }
		],
		quickActions: ['repair', 'aid', 'build'],
		theme: 'auto'
	},

	mobile: {
		layoutName: 'Mobile Optimized',
		panels: [
			{ id: 'alerts', position: 0, size: 'medium', visible: true, collapsed: false },
			{ id: 'resources', position: 1, size: 'medium', visible: true, collapsed: true },
			{ id: 'population', position: 2, size: 'medium', visible: true, collapsed: true },
			{ id: 'construction', position: 3, size: 'medium', visible: true, collapsed: true },
			{ id: 'structures', position: 4, size: 'medium', visible: true, collapsed: true },
			{ id: 'trade', position: 5, size: 'small', visible: false, collapsed: true },
			{ id: 'diplomacy', position: 6, size: 'small', visible: false, collapsed: true }
		],
		quickActions: ['build', 'collect'],
		theme: 'auto'
	}
};

/**
 * Creates the dashboard layout store with reactive state management
 */
function createDashboardLayoutStore() {
	// State - using plain variables (will be reactive when accessed via getters)
	let currentLayout: DashboardLayout = DEFAULT_LAYOUTS.default;
	let viewport: Viewport = 'desktop';

	// Viewport detection
	function detectViewport(): Viewport {
		if (!browser) return 'desktop';

		const width = window.innerWidth;
		if (width < 768) return 'mobile';
		if (width < 1024) return 'tablet';
		return 'desktop';
	}

	// Update viewport on resize
	if (browser) {
		viewport = detectViewport();

		window.addEventListener('resize', () => {
			viewport = detectViewport();
		});
	}

	// Load layout from localStorage
	function loadLayout(layoutName: string) {
		if (!browser) return;

		const stored = localStorage.getItem(`dashboard-layout-${layoutName}`);
		if (stored) {
			try {
				currentLayout = JSON.parse(stored);
			} catch (e) {
				console.error('Failed to load layout:', e);
				currentLayout = DEFAULT_LAYOUTS[layoutName] || DEFAULT_LAYOUTS.default;
			}
		} else {
			currentLayout = DEFAULT_LAYOUTS[layoutName] || DEFAULT_LAYOUTS.default;
		}
	}

	// Save layout to localStorage
	function saveLayout() {
		if (!browser) return;

		localStorage.setItem(
			`dashboard-layout-${currentLayout.layoutName}`,
			JSON.stringify(currentLayout)
		);
	}

	// Update panel configuration
	function updatePanel(panelId: string, updates: Partial<PanelConfig>) {
		currentLayout.panels = currentLayout.panels.map((panel: PanelConfig) =>
			panel.id === panelId ? { ...panel, ...updates } : panel
		);
		saveLayout();
	}

	// Reorder panels
	function reorderPanels(panelId: string, newPosition: number) {
		const panels = [...currentLayout.panels];
		const panel = panels.find((p: PanelConfig) => p.id === panelId);
		if (!panel) return;

		const oldPosition = panel.position;

		// Update positions
		for (const p of panels) {
			if (p.id === panelId) {
				p.position = newPosition;
			} else if (oldPosition < newPosition) {
				// Moving down: shift panels up
				if (p.position > oldPosition && p.position <= newPosition) {
					p.position--;
				}
			} else if (p.position >= newPosition && p.position < oldPosition) {
				// Moving up: shift panels down
				p.position++;
			}
		}

		const sortedPanels = panels.toSorted(
			(a: PanelConfig, b: PanelConfig) => a.position - b.position
		);
		currentLayout.panels = sortedPanels;
		saveLayout();
	}

	// Reset to default layout
	function resetLayout(layoutName: string = 'default') {
		currentLayout = { ...DEFAULT_LAYOUTS[layoutName] };
		saveLayout();
	}

	// Return store API
	return {
		// Getters
		getCurrentLayout: () => currentLayout,
		getViewport: () => viewport,
		getAvailableLayouts: () => Object.keys(DEFAULT_LAYOUTS),

		// Actions
		loadLayout,
		saveLayout,
		updatePanel,
		reorderPanels,
		resetLayout,

		// Panel-specific actions
		togglePanel(panelId: string) {
			updatePanel(panelId, {
				collapsed: !currentLayout.panels.find((p: PanelConfig) => p.id === panelId)?.collapsed
			});
		},

		showPanel(panelId: string) {
			updatePanel(panelId, { visible: true });
		},

		hidePanel(panelId: string) {
			updatePanel(panelId, { visible: false });
		},

		setPanelSize(panelId: string, size: 'small' | 'medium' | 'large') {
			updatePanel(panelId, { size });
		}
	};
}

// Export store instance
export const layoutStore = createDashboardLayoutStore();
