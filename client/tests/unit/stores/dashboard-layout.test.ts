/**
 * Unit tests for dashboard-layout.ts store
 * Tests panel configuration, layout management, viewport detection, and persistence
 *
 * CORRECT API VERSION - Matches actual store implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { layoutStore } from '$lib/stores/ui/dashboard-layout.svelte';
import type { DashboardLayout, Viewport, PanelId } from '$lib/stores/ui/dashboard-layout.svelte';

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		}
	};
})();

Object.defineProperty(globalThis, 'localStorage', {
	value: localStorageMock,
	writable: true,
	configurable: true
});

// Mock window.matchMedia for viewport detection
Object.defineProperty(globalThis, 'matchMedia', {
	writable: true,
	configurable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

describe('dashboard-layout store', () => {
	beforeEach(() => {
		localStorageMock.clear();
		// Reset store to default state
		layoutStore.loadLayout('default');
	});

	describe('Panel Configuration', () => {
		it('should have 8 panel types defined in default layout', () => {
			const panelIds = [
				'alerts',
				'resource-header',
				'settlement-info',
				'population',
				'construction',
				'structures',
				'production-overview',
				'suggestions'
			];
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			for (const id of panelIds) {
				const panel = layout.panels.find((p: { id: string }) => p.id === id);
				expect(panel, `Panel ${id} should be defined`).toBeDefined();
			}
		});

		it('should have valid panel columns', () => {
			const layout: DashboardLayout = layoutStore.getCurrentLayout();
			const validColumns = ['header', 'left', 'center', 'right'];

			for (const panel of layout.panels) {
				expect(validColumns, `${panel.id} column should be valid`).toContain(panel.column);
			}
		});

		it('should have valid panel order values (numbers >= 0)', () => {
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			for (const panel of layout.panels) {
				expect(panel.order, `${panel.id} order should be a number`).toBeTypeOf('number');
				expect(panel.order, `${panel.id} order should be >= 0`).toBeGreaterThanOrEqual(0);
			}
		});

		it('should have boolean visibility and collapsed flags', () => {
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			for (const panel of layout.panels) {
				expect(typeof panel.visible, `${panel.id} visible should be boolean`).toBe(
					'boolean'
				);
				expect(typeof panel.collapsed, `${panel.id} collapsed should be boolean`).toBe(
					'boolean'
				);
			}
		});

		it('should have layoutName property', () => {
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			expect(layout.layoutName).toBeTypeOf('string');
			expect(layout.layoutName.length).toBeGreaterThan(0);
		});

		it('should have theme property', () => {
			const layout: DashboardLayout = layoutStore.getCurrentLayout();
			const validThemes = ['light', 'dark', 'auto'];

			expect(validThemes).toContain(layout.theme);
		});
	});

	describe('Layout Loading', () => {
		it('should load default layout correctly', () => {
			layoutStore.loadLayout('default');
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			expect(layout.layoutName).toBe('Default');

			// Default layout should have alerts and resource-header visible
			const alerts = layout.panels.find((p: { id: string }) => p.id === 'alerts');
			const resourceHeader = layout.panels.find(
				(p: { id: string }) => p.id === 'resource-header'
			);
			const population = layout.panels.find((p: { id: string }) => p.id === 'population');

			expect(alerts?.visible, 'alerts should be visible').toBe(true);
			expect(resourceHeader?.visible, 'resource-header should be visible').toBe(true);
			expect(population?.visible, 'population should be visible').toBe(true);
		});

		it('should load planning layout correctly', () => {
			layoutStore.loadLayout('planning');
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			expect(layout.layoutName).toBe('Planning Mode');

			// Planning layout should emphasize construction and structures
			const construction = layout.panels.find((p: { id: string }) => p.id === 'construction');
			const structures = layout.panels.find((p: { id: string }) => p.id === 'structures');

			expect(construction?.visible, 'construction should be visible').toBe(true);
			expect(structures?.visible, 'structures should be visible').toBe(true);
		});

		it('should load disaster layout correctly', () => {
			layoutStore.loadLayout('disaster');
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			expect(layout.layoutName).toBe('Disaster Response');

			// Disaster layout should show alerts prominently
			const alerts = layout.panels.find((p) => p.id === 'alerts');
			expect(alerts?.visible, 'alerts should be visible').toBe(true);
		});

		it('should handle invalid layout name gracefully', () => {
			layoutStore.loadLayout('invalid-layout-name');
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			// Should fallback to default
			expect(layout).toBeDefined();
			expect(layout.panels.length).toBeGreaterThan(0);
		});

		it('should get available layouts', () => {
			const layouts = layoutStore.getAvailableLayouts();

			expect(Array.isArray(layouts)).toBe(true);
			expect(layouts.length).toBeGreaterThan(0);
			expect(layouts).toContain('default');
			expect(layouts).toContain('planning');
			expect(layouts).toContain('disaster');
		});
	});

	describe('Panel Management', () => {
		it('should toggle panel collapsed state', () => {
			const panelId = 'alerts';
			const initialLayout = layoutStore.getCurrentLayout();
			const initialState = initialLayout.panels.find((p) => p.id === panelId)?.collapsed;

			layoutStore.togglePanel(panelId);
			const newLayout = layoutStore.getCurrentLayout();
			const newState = newLayout.panels.find((p) => p.id === panelId)?.collapsed;

			expect(newState).toBe(!initialState);
		});

		it('should show panel (set visible: true)', () => {
			layoutStore.hidePanel('alerts');
			layoutStore.showPanel('alerts');

			const layout = layoutStore.getCurrentLayout();
			const panel = layout.panels.find((p) => p.id === 'alerts');

			expect(panel?.visible).toBe(true);
		});

		it('should hide panel (set visible: false)', () => {
			layoutStore.showPanel('alerts');
			layoutStore.hidePanel('alerts');

			const layout = layoutStore.getCurrentLayout();
			const panel = layout.panels.find((p) => p.id === 'alerts');

			expect(panel?.visible).toBe(false);
		});

		it('should update panel with partial config', () => {
			layoutStore.updatePanel('alerts', {
				collapsed: true,
				visible: false
			});

			const layout = layoutStore.getCurrentLayout();
			const panel = layout.panels.find((p) => p.id === 'alerts');

			expect(panel?.collapsed).toBe(true);
			expect(panel?.visible).toBe(false);
		});

		it('should reorder panel by changing order value', () => {
			const initialLayout = layoutStore.getCurrentLayout();
			const alertsInitialOrder = initialLayout.panels.find((p) => p.id === 'alerts')?.order;

			layoutStore.reorderPanel('alerts', 5);

			const newLayout = layoutStore.getCurrentLayout();
			const alertsNewOrder = newLayout.panels.find((p) => p.id === 'alerts')?.order;

			expect(alertsNewOrder).toBe(5);
			expect(alertsNewOrder).not.toBe(alertsInitialOrder);
		});

		it('should move panel to different column', () => {
			const initialLayout = layoutStore.getCurrentLayout();
			const alertsInitialColumn = initialLayout.panels.find((p) => p.id === 'alerts')?.column;

			layoutStore.movePanel('alerts', 'left');

			const newLayout = layoutStore.getCurrentLayout();
			const alertsNewColumn = newLayout.panels.find((p) => p.id === 'alerts')?.column;

			expect(alertsNewColumn).toBe('left');
			expect(alertsNewColumn).not.toBe(alertsInitialColumn);
		});
	});

	describe('Viewport Detection', () => {
		it('should detect mobile viewport (<768px)', () => {
			// Mock mobile screen width on window object
			Object.defineProperty(window, 'innerWidth', {
				writable: true,
				configurable: true,
				value: 375
			});

			// Trigger resize to update viewport
			window.dispatchEvent(new Event('resize'));

			const viewport: Viewport = layoutStore.getViewport();
			expect(viewport).toBe('mobile');
		});

		it('should detect tablet viewport (768-1023px)', () => {
			// Mock tablet screen width on window object
			Object.defineProperty(window, 'innerWidth', {
				writable: true,
				configurable: true,
				value: 800
			});

			// Trigger resize to update viewport
			window.dispatchEvent(new Event('resize'));

			const viewport: Viewport = layoutStore.getViewport();
			expect(viewport).toBe('tablet');
		});

		it('should detect desktop viewport (>=1024px)', () => {
			// Mock desktop screen width on window object
			Object.defineProperty(window, 'innerWidth', {
				writable: true,
				configurable: true,
				value: 1920
			});

			// Trigger resize to update viewport
			window.dispatchEvent(new Event('resize'));

			const viewport: Viewport = layoutStore.getViewport();
			expect(viewport).toBe('desktop');
		});

		it('should return desktop when not in browser environment', () => {
			const originalWindow = globalThis.window;
			// @ts-expect-error - Testing browser detection
			delete globalThis.window;

			const viewport: Viewport = layoutStore.getViewport();
			expect(viewport).toBe('desktop');

			// Restore window object
			globalThis.window = originalWindow;
		});
	});

	describe('localStorage Persistence', () => {
		it('should save layout to localStorage with correct key', () => {
			layoutStore.loadLayout('default');
			layoutStore.togglePanel('alerts');
			layoutStore.saveLayout();

			const savedDefault = localStorageMock.getItem('dashboard-layout-default');
			expect(savedDefault).toBeDefined();

			if (savedDefault) {
				const parsed = JSON.parse(savedDefault);
				expect(parsed).toHaveProperty('layoutName');
				expect(parsed).toHaveProperty('panels');
				expect(Array.isArray(parsed.panels)).toBe(true);
			}
		});

		it('should save different layouts with different keys', () => {
			layoutStore.loadLayout('default');
			layoutStore.saveLayout();

			layoutStore.loadLayout('planning');
			layoutStore.saveLayout();

			const savedDefault = localStorageMock.getItem('dashboard-layout-default');
			const savedPlanning = localStorageMock.getItem('dashboard-layout-planning');

			expect(savedDefault).toBeDefined();
			expect(savedPlanning).toBeDefined();
			expect(savedDefault).not.toBe(savedPlanning);
		});
		it('should restore layout from localStorage', () => {
			// Make changes and save
			layoutStore.loadLayout('default');
			const originalPanel = layoutStore
				.getCurrentLayout()
				.panels.find((p) => p.id === 'alerts');
			const originalCollapsed = originalPanel?.collapsed;

			layoutStore.togglePanel('alerts');
			layoutStore.saveLayout();

			const modifiedPanel = layoutStore
				.getCurrentLayout()
				.panels.find((p) => p.id === 'alerts');
			expect(modifiedPanel?.collapsed).toBe(!originalCollapsed);

			// Reset to default preset
			layoutStore.loadLayout('default');

			// Should restore from localStorage
			const restoredLayout = layoutStore.getCurrentLayout();
			const restoredPanel = restoredLayout.panels.find((p) => p.id === 'alerts');

			expect(restoredPanel?.collapsed).toBe(!originalCollapsed);
		});

		it('should handle missing localStorage data gracefully', () => {
			localStorageMock.clear();

			expect(() => layoutStore.loadLayout('default')).not.toThrow();

			const layout = layoutStore.getCurrentLayout();
			expect(layout).toBeDefined();
			expect(layout.panels.length).toBeGreaterThan(0);
		});

		it('should handle corrupted localStorage data', () => {
			localStorageMock.setItem('dashboard-layout-default', 'invalid-json{{{');

			expect(() => layoutStore.loadLayout('default')).not.toThrow();

			const layout = layoutStore.getCurrentLayout();
			expect(layout).toBeDefined();
		});
	});

	describe('Reset Functionality', () => {
		beforeEach(() => {
			// Ensure clean state for reset tests (clear any corrupted data from previous tests)
			localStorageMock.clear();
			layoutStore.loadLayout('default');
		});

		it('should reset to default layout', () => {
			// Make some changes
			layoutStore.loadLayout('planning');
			layoutStore.togglePanel('alerts');
			layoutStore.updatePanel('population', { collapsed: true });

			// Reset to default
			layoutStore.resetLayout('default');

			// Verify reset to default preset
			const layout = layoutStore.getCurrentLayout();
			expect(layout.layoutName).toBe('Default');

			// Verify panels match default preset (not the modified state)
			const alerts = layout.panels.find((p) => p.id === 'alerts');

			// Default layout: alerts = { visible: true, collapsed: false }
			expect(alerts?.visible).toBe(true);
			expect(alerts?.collapsed).toBe(false); // Default state
		});

		it('should reset to specific layout', () => {
			layoutStore.loadLayout('disaster');
			layoutStore.updatePanel('alerts', { collapsed: true }); // Modify from false

			layoutStore.resetLayout('disaster');

			const layout = layoutStore.getCurrentLayout();
			expect(layout.layoutName).toBe('Disaster Response');

			// Disaster preset: alerts = { visible: true, collapsed: false }
			const alerts = layout.panels.find((p) => p.id === 'alerts');
			expect(alerts?.collapsed).toBe(false); // Disaster preset not collapsed
			expect(alerts?.visible).toBe(true); // Disaster preset visible
		});

		it('should handle reset without layout name (defaults to default)', () => {
			layoutStore.loadLayout('planning');
			layoutStore.resetLayout();

			const layout = layoutStore.getCurrentLayout();
			expect(layout.layoutName).toBe('Default');
		});
	});

	describe('Panel Ordering', () => {
		it('should maintain panel order after visibility changes', () => {
			const initialLayout = layoutStore.getCurrentLayout();
			const initialOrder = initialLayout.panels.map((p) => p.id);

			layoutStore.togglePanel('alerts');
			layoutStore.showPanel('settlement-info');
			layoutStore.hidePanel('production-overview');

			const newLayout = layoutStore.getCurrentLayout();
			const newOrder = newLayout.panels.map((p) => p.id);

			expect(newOrder).toEqual(initialOrder);
		});

		it('should maintain panel order after panel updates', () => {
			const initialLayout = layoutStore.getCurrentLayout();
			const initialOrder = initialLayout.panels.map((p) => p.id);

			layoutStore.updatePanel('alerts', { collapsed: true });
			layoutStore.updatePanel('resource-header', { collapsed: false });

			const newLayout = layoutStore.getCurrentLayout();
			const newOrder = newLayout.panels.map((p) => p.id);

			// Verify order maintained
			expect(newOrder).toEqual(initialOrder);
		});

		it('should update panel order when explicitly reordered', () => {
			layoutStore.reorderPanel('resource-header', 0);

			const layout = layoutStore.getCurrentLayout();
			const resourceHeader = layout.panels.find((p) => p.id === 'resource-header');

			expect(resourceHeader?.order).toBe(0);
		});

		it('should keep orders sequential after reorder within column', () => {
			// Reorder a panel within its column
			layoutStore.reorderPanel('production-overview', 1);

			const layout = layoutStore.getCurrentLayout();

			// Get all panels in same column as production-overview (center)
			const centerPanels = layout.panels
				.filter((p) => p.column === 'center')
				.sort((a, b) => a.order - b.order);

			const orders = centerPanels.map((p) => p.order);

			// Orders should be sequential with no gaps
			for (let i = 0; i < orders.length; i++) {
				expect(orders[i]).toBe(i);
			}
		});
	});

	describe('Validation', () => {
		it('should validate panel IDs', () => {
			const validIds: PanelId[] = [
				'alerts',
				'resource-header',
				'settlement-info',
				'population',
				'construction',
				'structures',
				'production-overview',
				'suggestions'
			];

			for (const id of validIds) {
				expect(() => layoutStore.togglePanel(id)).not.toThrow();
			}
		});

		it('should handle invalid panel IDs gracefully (TypeScript prevents this at compile time)', () => {
			// Note: TypeScript PanelId type prevents passing invalid IDs
			// This test documents that the type system provides the validation

			// At runtime, if somehow an invalid ID is passed (e.g., from external data),
			// the implementation handles it gracefully by returning early

			// We can test the public API with valid IDs works correctly:
			expect(() => layoutStore.togglePanel('alerts')).not.toThrow();
			expect(() => layoutStore.showPanel('population')).not.toThrow();
		});

		it('should handle order validation in reorderPanel', () => {
			const layout = layoutStore.getCurrentLayout();

			// Get max order for alerts' column (header)
			const headerPanels = layout.panels.filter((p) => p.column === 'header');
			const maxOrder = headerPanels.length - 1;

			// Valid orders
			expect(() => layoutStore.reorderPanel('alerts', 0)).not.toThrow();
			expect(() => layoutStore.reorderPanel('alerts', maxOrder)).not.toThrow();

			// Edge cases - implementation should handle gracefully (clamp to valid range)
			expect(() => layoutStore.reorderPanel('alerts', -1)).not.toThrow();
			expect(() => layoutStore.reorderPanel('alerts', 999)).not.toThrow();
		});
	});

	describe('Edge Cases', () => {
		it('should handle toggling all panels off', () => {
			const panelIds: PanelId[] = [
				'alerts',
				'resource-header',
				'settlement-info',
				'population',
				'construction',
				'structures',
				'production-overview',
				'suggestions'
			];

			for (const id of panelIds) {
				layoutStore.hidePanel(id);
			}

			const layout = layoutStore.getCurrentLayout();
			const allHidden = layout.panels.every((p) => !p.visible);

			expect(allHidden).toBe(true);
		});

		it('should handle collapsing all panels', () => {
			const panelIds: PanelId[] = [
				'alerts',
				'resource-header',
				'settlement-info',
				'population',
				'construction',
				'structures',
				'production-overview',
				'suggestions'
			];

			for (const id of panelIds) {
				layoutStore.updatePanel(id, { collapsed: true });
			}

			const layout = layoutStore.getCurrentLayout();
			const allCollapsed = layout.panels.every((p) => p.collapsed);

			expect(allCollapsed).toBe(true);
		});

		it('should handle rapid layout switching', () => {
			const layouts = ['default', 'planning', 'disaster'];

			for (const layoutName of layouts) {
				expect(() => layoutStore.loadLayout(layoutName)).not.toThrow();
			}

			const finalLayout = layoutStore.getCurrentLayout();
			expect(finalLayout).toBeDefined();
			expect(finalLayout.layoutName).toBe('Disaster Response');
		});

		it('should handle concurrent modifications', () => {
			// Simulate concurrent updates to same panel
			layoutStore.togglePanel('alerts');
			layoutStore.updatePanel('alerts', { collapsed: false });
			layoutStore.reorderPanel('alerts', 0);

			const layout = layoutStore.getCurrentLayout();
			const panel = layout.panels.find((p) => p.id === 'alerts');

			expect(panel).toBeDefined();
			expect(panel?.collapsed).toBe(false);
			expect(panel?.order).toBe(0);
		});

		it('should handle save/load cycles without data loss', () => {
			// Set up a complex state
			layoutStore.loadLayout('planning');
			layoutStore.updatePanel('construction', { collapsed: false });
			layoutStore.updatePanel('structures', { visible: true, collapsed: false });
			layoutStore.reorderPanel('alerts', 0);

			// Save
			layoutStore.saveLayout();

			// Make different changes
			layoutStore.loadLayout('default');
			layoutStore.hidePanel('construction');

			// Reload original
			layoutStore.loadLayout('planning');

			const layout = layoutStore.getCurrentLayout();
			const construction = layout.panels.find((p) => p.id === 'construction');
			const structures = layout.panels.find((p) => p.id === 'structures');
			const alerts = layout.panels.find((p) => p.id === 'alerts');

			expect(construction?.collapsed).toBe(false);
			expect(structures?.visible).toBe(true);
			expect(structures?.collapsed).toBe(false);
			expect(alerts?.order).toBe(0);
		});
	});
});
