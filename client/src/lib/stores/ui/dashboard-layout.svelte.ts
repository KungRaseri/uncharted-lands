/**
 * Dashboard Layout Store
 *
 * Simplified dashboard layout management with:
 * - Explicit column assignment (header/left/center/right)
 * - Simple ordering within columns
 * - Viewport-specific column overrides
 * - Panel visibility/collapse
 * - Layout persistence (localStorage)
 */

import { browser } from '$app/environment';
import { logger } from '$lib/utils/logger';

// ==================== TYPE DEFINITIONS ====================

/**
 * Panel IDs - all available panels
 */
export type PanelId =
	| 'alerts'
	| 'resource-header'
	| 'settlement-info'
	| 'population'
	| 'construction'
	| 'structures'
	| 'production-overview'
	| 'suggestions';

/**
 * Desktop/Tablet column types
 */
export type DesktopColumn = 'header' | 'left' | 'center' | 'right';

/**
 * Tablet column types (2-column layout)
 */
export type TabletColumn = 'header' | 'left' | 'main';

/**
 * Mobile column types (single stack)
 */
export type MobileColumn = 'header' | 'stack';

/**
 * Viewport types
 */
export type Viewport = 'mobile' | 'tablet' | 'desktop';

/**
 * Panel configuration with explicit column assignment
 */
export interface PanelConfig {
	id: PanelId;
	column: DesktopColumn; // Desktop column
	order: number; // Order within column (0, 1, 2...)
	visible: boolean;
	collapsed: boolean;

	// Viewport-specific overrides
	tabletColumn?: TabletColumn;
	mobileColumn?: MobileColumn;
}

/**
 * Complete dashboard layout
 */
export interface DashboardLayout {
	layoutName: string;
	panels: PanelConfig[];
	theme: 'light' | 'dark' | 'auto';
}

// ==================== PANEL METADATA ====================

/**
 * Panel metadata for documentation and defaults
 */
export const PANEL_METADATA = {
	alerts: {
		name: 'Alerts',
		description: 'Critical warnings and notifications',
		defaultColumn: 'header' as DesktopColumn
	},
	'resource-header': {
		name: 'Resource Bar',
		description: 'Quick resource overview',
		defaultColumn: 'header' as DesktopColumn
	},
	'settlement-info': {
		name: 'Settlement Info',
		description: 'Basic settlement details',
		defaultColumn: 'left' as DesktopColumn
	},
	population: {
		name: 'Population',
		description: 'Population stats and growth',
		defaultColumn: 'left' as DesktopColumn
	},
	construction: {
		name: 'Construction Queue',
		description: 'Active and queued buildings',
		defaultColumn: 'right' as DesktopColumn
	},
	structures: {
		name: 'Structures',
		description: 'Buildings and extractors',
		defaultColumn: 'center' as DesktopColumn
	},
	'production-overview': {
		name: 'Production',
		description: 'Resource production rates',
		defaultColumn: 'center' as DesktopColumn
	},
	suggestions: {
		name: 'Suggestions',
		description: 'AI-powered next actions',
		defaultColumn: 'right' as DesktopColumn
	}
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a panel configuration with defaults
 */
function createPanel(
	id: PanelId,
	column: DesktopColumn,
	order: number,
	overrides: Partial<PanelConfig> = {}
): PanelConfig {
	return {
		id,
		column,
		order,
		visible: true,
		collapsed: false,
		...overrides
	};
}

// ==================== DEFAULT LAYOUTS ====================

/**
 * Pre-configured layouts for different use cases
 */
const DEFAULT_LAYOUTS: Record<string, DashboardLayout> = {
	default: {
		layoutName: 'Default',
		panels: [
			// Header row
			createPanel('alerts', 'header', 0),
			createPanel('resource-header', 'header', 1),

			// Left column - Settlement info & population
			createPanel('settlement-info', 'left', 0, {
				tabletColumn: 'left',
				mobileColumn: 'stack'
			}),
			createPanel('population', 'left', 1, {
				tabletColumn: 'left',
				mobileColumn: 'stack'
			}),

			// Center column - Main content
			createPanel('structures', 'center', 0, {
				tabletColumn: 'main',
				mobileColumn: 'stack'
			}),
			createPanel('production-overview', 'center', 1, {
				tabletColumn: 'main',
				mobileColumn: 'stack',
				visible: false // Hidden by default
			}),

			// Right column - Actions & queue
			createPanel('construction', 'right', 0, {
				tabletColumn: 'main',
				mobileColumn: 'stack'
			}),
			createPanel('suggestions', 'right', 1, {
				tabletColumn: 'main',
				mobileColumn: 'stack',
				visible: false // Hidden by default
			})
		],
		theme: 'auto'
	},

	planning: {
		layoutName: 'Planning Mode',
		panels: [
			// Header
			createPanel('resource-header', 'header', 0),
			createPanel('alerts', 'header', 1, { collapsed: true }),

			// Left - Compact info
			createPanel('settlement-info', 'left', 0),
			createPanel('population', 'left', 1, { collapsed: true }),

			// Center - Focus on structures & production
			createPanel('structures', 'center', 0),
			createPanel('production-overview', 'center', 1),

			// Right - Construction prominent
			createPanel('construction', 'right', 0),
			createPanel('suggestions', 'right', 1)
		],
		theme: 'auto'
	},

	disaster: {
		layoutName: 'Disaster Response',
		panels: [
			// Header - Alerts prominent
			createPanel('alerts', 'header', 0),
			createPanel('resource-header', 'header', 1),

			// Left - Critical info
			createPanel('settlement-info', 'left', 0),
			createPanel('population', 'left', 1),

			// Center - Structures for damage assessment
			createPanel('structures', 'center', 0),
			createPanel('production-overview', 'center', 1, { collapsed: true }),

			// Right - Construction for repairs
			createPanel('construction', 'right', 0),
			createPanel('suggestions', 'right', 1, { visible: false })
		],
		theme: 'auto'
	}
};

// ==================== STORE IMPLEMENTATION ====================

/**
 * Creates the dashboard layout store with reactive state management
 */
function createDashboardLayoutStore() {
	// State - using plain variables (reactive when accessed via getters)
	let currentLayout: DashboardLayout = JSON.parse(JSON.stringify(DEFAULT_LAYOUTS.default));
	let viewport: Viewport = 'desktop';

	// ========== Viewport Detection ==========

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

	// ========== Layout Persistence ==========

	function loadLayout(layoutName: string) {
		if (!browser) return;

		const normalizedKey = layoutName.toLowerCase();
		const stored = localStorage.getItem(`dashboard-layout-${normalizedKey}`);

		if (stored) {
			try {
				currentLayout = JSON.parse(stored);
			} catch (e) {
				logger.error('Failed to load layout:', e);
				currentLayout = JSON.parse(
					JSON.stringify(DEFAULT_LAYOUTS[layoutName] || DEFAULT_LAYOUTS.default)
				);
			}
		} else {
			currentLayout = JSON.parse(
				JSON.stringify(DEFAULT_LAYOUTS[layoutName] || DEFAULT_LAYOUTS.default)
			);
		}
	}

	function saveLayout() {
		if (!browser) return;

		const layoutKey =
			Object.keys(DEFAULT_LAYOUTS).find(
				(key) => DEFAULT_LAYOUTS[key].layoutName === currentLayout.layoutName
			) || 'default';

		const normalizedKey = layoutKey.toLowerCase();
		localStorage.setItem(`dashboard-layout-${normalizedKey}`, JSON.stringify(currentLayout));
	}

	// ========== Panel Management ==========

	function updatePanel(panelId: PanelId, updates: Partial<PanelConfig>) {
		currentLayout.panels = currentLayout.panels.map((panel) =>
			panel.id === panelId ? { ...panel, ...updates } : panel
		);
		saveLayout();
	}

	function resetLayout(layoutName: string = 'default') {
		currentLayout = JSON.parse(JSON.stringify(DEFAULT_LAYOUTS[layoutName]));
		saveLayout();
	}

	// ========== Public API ==========

	return {
		// Getters
		getCurrentLayout: () => currentLayout,
		getViewport: () => viewport,
		getAvailableLayouts: () => Object.keys(DEFAULT_LAYOUTS),
		getPanelMetadata: (panelId: PanelId) => PANEL_METADATA[panelId],

		// Layout actions
		loadLayout,
		saveLayout,
		resetLayout,

		// Panel actions (simplified - no reordering)
		updatePanel,

		togglePanel(panelId: PanelId) {
			const panel = currentLayout.panels.find((p) => p.id === panelId);
			if (panel) {
				updatePanel(panelId, { collapsed: !panel.collapsed });
			}
		},

		showPanel(panelId: PanelId) {
			updatePanel(panelId, { visible: true });
		},

		hidePanel(panelId: PanelId) {
			updatePanel(panelId, { visible: false });
		},

		// Move panel to different column
		movePanel(panelId: PanelId, column: DesktopColumn) {
			updatePanel(panelId, { column });
		},

		// Change panel order within its column
		reorderPanel(panelId: PanelId, newOrder: number) {
			updatePanel(panelId, { order: newOrder });
		}
	};
}

// Export store instance
export const layoutStore = createDashboardLayoutStore();
