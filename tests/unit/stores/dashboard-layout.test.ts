/**
 * Unit tests for dashboard-layout.ts store
 * Tests panel configuration, layout management, viewport detection, and persistence
 *
 * CORRECT API VERSION - Matches actual store implementation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { layoutStore } from '$lib/stores/ui/dashboard-layout';
import type { DashboardLayout, Viewport } from '$lib/stores/ui/dashboard-layout';

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
		it('should have 7 panel types defined in default layout', () => {
			const panelIds = [
				'alerts',
				'resources',
				'population',
				'construction',
				'structures',
				'trade',
				'diplomacy'
			];
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			for (const id of panelIds) {
				const panel = layout.panels.find((p) => p.id === id);
				expect(panel, `Panel ${id} should be defined`).toBeDefined();
			}
		});

		it('should have valid panel positions (sequential numbers)', () => {
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			for (const panel of layout.panels) {
				expect(panel.position, `${panel.id} position should be a number`).toBeTypeOf('number');
				expect(panel.position, `${panel.id} position should be >= 0`).toBeGreaterThanOrEqual(0);
				expect(panel.position, `${panel.id} position should be < panels length`).toBeLessThan(
					layout.panels.length
				);
			}
		});

		it('should have unique panel positions', () => {
			const layout: DashboardLayout = layoutStore.getCurrentLayout();
			const positions = layout.panels.map((p) => p.position);
			const uniquePositions = new Set(positions);

			expect(uniquePositions.size).toBe(positions.length);
		});

		it('should have valid panel sizes', () => {
			const layout: DashboardLayout = layoutStore.getCurrentLayout();
			const validSizes = ['small', 'medium', 'large'];

			for (const panel of layout.panels) {
				expect(validSizes, `${panel.id} size should be valid`).toContain(panel.size);
			}
		});

		it('should have boolean visibility and collapsed flags', () => {
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			for (const panel of layout.panels) {
				expect(typeof panel.visible, `${panel.id} visible should be boolean`).toBe('boolean');
				expect(typeof panel.collapsed, `${panel.id} collapsed should be boolean`).toBe('boolean');
			}
		});

		it('should have layoutName property', () => {
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			expect(layout.layoutName).toBeTypeOf('string');
			expect(layout.layoutName.length).toBeGreaterThan(0);
		});

		it('should have quickActions array', () => {
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			expect(Array.isArray(layout.quickActions)).toBe(true);
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

			// Default layout should have alerts, resources, and population visible
			const alerts = layout.panels.find((p) => p.id === 'alerts');
			const resources = layout.panels.find((p) => p.id === 'resources');
			const population = layout.panels.find((p) => p.id === 'population');

			expect(alerts?.visible, 'alerts should be visible').toBe(true);
			expect(resources?.visible, 'resources should be visible').toBe(true);
			expect(population?.visible, 'population should be visible').toBe(true);
		});

		it('should load planning layout correctly', () => {
			layoutStore.loadLayout('planning');
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			expect(layout.layoutName).toBe('Planning Mode');

			// Planning layout should emphasize construction and structures
			const construction = layout.panels.find((p) => p.id === 'construction');
			const structures = layout.panels.find((p) => p.id === 'structures');

			expect(construction?.visible, 'construction should be visible').toBe(true);
			expect(structures?.visible, 'structures should be visible').toBe(true);
		});

		it('should load combat layout correctly', () => {
			layoutStore.loadLayout('combat');
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			expect(layout.layoutName).toBe('Disaster Response');

			// Combat layout should show alerts prominently
			const alerts = layout.panels.find((p) => p.id === 'alerts');
			expect(alerts?.visible, 'alerts should be visible').toBe(true);
			expect(alerts?.size, 'alerts should be large').toBe('large');
		});

		it('should load mobile layout correctly', () => {
			layoutStore.loadLayout('mobile');
			const layout: DashboardLayout = layoutStore.getCurrentLayout();

			expect(layout.layoutName).toBe('Mobile Optimized');

			// Mobile layout should have most panels collapsed
			const collapsedCount = layout.panels.filter((p) => p.collapsed).length;
			expect(collapsedCount, 'most panels should be collapsed').toBeGreaterThan(
				layout.panels.length / 2
			);
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
			expect(layouts).toContain('combat');
			expect(layouts).toContain('mobile');
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

		it('should set panel size', () => {
			layoutStore.setPanelSize('alerts', 'large');
			const layout = layoutStore.getCurrentLayout();
			const panel = layout.panels.find((p) => p.id === 'alerts');

			expect(panel?.size).toBe('large');

			layoutStore.setPanelSize('alerts', 'small');
			const layout2 = layoutStore.getCurrentLayout();
			const panel2 = layout2.panels.find((p) => p.id === 'alerts');

			expect(panel2?.size).toBe('small');
		});

		it('should update panel with partial config', () => {
			layoutStore.updatePanel('alerts', {
				size: 'large',
				collapsed: true
			});

			const layout = layoutStore.getCurrentLayout();
			const panel = layout.panels.find((p) => p.id === 'alerts');

			expect(panel?.size).toBe('large');
			expect(panel?.collapsed).toBe(true);
		});

		it('should reorder panels by changing position', () => {
			const initialLayout = layoutStore.getCurrentLayout();
			const alertsInitialPos = initialLayout.panels.find((p) => p.id === 'alerts')?.position;

			layoutStore.reorderPanels('alerts', 5);

			const newLayout = layoutStore.getCurrentLayout();
			const alertsNewPos = newLayout.panels.find((p) => p.id === 'alerts')?.position;

			expect(alertsNewPos).toBe(5);
			expect(alertsNewPos).not.toBe(alertsInitialPos);
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

			const savedDefault = localStorageMock.getItem('dashboard-layout-Default');
			const savedPlanning = localStorageMock.getItem('dashboard-layout-Planning Mode');

			expect(savedDefault).toBeDefined();
			expect(savedPlanning).toBeDefined();
			expect(savedDefault).not.toBe(savedPlanning);
		});

		it('should restore layout from localStorage', () => {
			// Make changes and save
			layoutStore.loadLayout('default');
			const originalPanel = layoutStore.getCurrentLayout().panels.find((p) => p.id === 'alerts');
			const originalCollapsed = originalPanel?.collapsed;

			layoutStore.togglePanel('alerts');
			layoutStore.saveLayout();

			const modifiedPanel = layoutStore.getCurrentLayout().panels.find((p) => p.id === 'alerts');
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
		it('should reset to default layout', () => {
			// Make some changes
			layoutStore.loadLayout('planning');
			layoutStore.togglePanel('alerts');
			layoutStore.setPanelSize('resources', 'medium'); // Change from large
			layoutStore.updatePanel('population', { collapsed: true });

			// Reset to default
			layoutStore.resetLayout('default');

			// Verify reset to default preset
			const layout = layoutStore.getCurrentLayout();
			expect(layout.layoutName).toBe('Default');

			// Verify panels match default preset (not the modified state)
			const alerts = layout.panels.find((p) => p.id === 'alerts');
			const resources = layout.panels.find((p) => p.id === 'resources');

			// Default layout: alerts = { visible: true, collapsed: false, size: 'medium' }
			expect(alerts?.visible).toBe(true);
			expect(alerts?.collapsed).toBe(false); // Default state
			expect(alerts?.size).toBe('medium'); // Default state
			expect(resources?.size).toBe('large'); // Default state
		});

		it('should reset to specific layout', () => {
			layoutStore.loadLayout('combat');
			layoutStore.setPanelSize('alerts', 'small'); // Modify from large
			layoutStore.updatePanel('alerts', { collapsed: true }); // Modify from false

			layoutStore.resetLayout('combat');

			const layout = layoutStore.getCurrentLayout();
			expect(layout.layoutName).toBe('Disaster Response');

			// Combat preset: alerts = { visible: true, collapsed: false, size: 'large' }
			const alerts = layout.panels.find((p) => p.id === 'alerts');
			expect(alerts?.size).toBe('large'); // Combat preset has large alerts
			expect(alerts?.collapsed).toBe(false); // Combat preset not collapsed
			expect(alerts?.visible).toBe(true); // Combat preset visible
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
			layoutStore.showPanel('trade');
			layoutStore.hidePanel('diplomacy');

			const newLayout = layoutStore.getCurrentLayout();
			const newOrder = newLayout.panels.map((p) => p.id);

			expect(newOrder).toEqual(initialOrder);
		});

		it('should maintain panel order after size changes', () => {
			const initialLayout = layoutStore.getCurrentLayout();
			const initialOrder = initialLayout.panels.map((p) => p.id);

			layoutStore.setPanelSize('alerts', 'large');
			layoutStore.setPanelSize('resources', 'small');

			const newLayout = layoutStore.getCurrentLayout();
			const newOrder = newLayout.panels.map((p) => p.id);

			// Verify order maintained
			expect(newOrder).toEqual(initialOrder);
		});

		it('should update panel order when explicitly reordered', () => {
			layoutStore.reorderPanels('resources', 0);

			const layout = layoutStore.getCurrentLayout();
			const resources = layout.panels.find((p) => p.id === 'resources');

			expect(resources?.position).toBe(0);
		});

		it('should keep positions sequential after reorder', () => {
			layoutStore.reorderPanels('diplomacy', 2);

			const layout = layoutStore.getCurrentLayout();
			const positions = layout.panels.map((p) => p.position).sort((a, b) => a - b);

			for (let i = 0; i < positions.length; i++) {
				expect(positions[i]).toBe(i);
			}
		});
	});

	describe('Validation', () => {
		it('should validate panel IDs', () => {
			const validIds = [
				'alerts',
				'resources',
				'population',
				'construction',
				'structures',
				'trade',
				'diplomacy'
			];

			for (const id of validIds) {
				expect(() => layoutStore.togglePanel(id)).not.toThrow();
			}
		});

		it('should handle invalid panel IDs gracefully', () => {
			expect(() => layoutStore.togglePanel('invalid-panel-id')).not.toThrow();
			expect(() => layoutStore.showPanel('nonexistent')).not.toThrow();
			expect(() => layoutStore.setPanelSize('fake-panel', 'large')).not.toThrow();
		});

		it('should validate panel sizes', () => {
			const validSizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

			for (const size of validSizes) {
				expect(() => layoutStore.setPanelSize('alerts', size)).not.toThrow();
			}
		});

		it('should handle position validation in reorderPanels', () => {
			const layout = layoutStore.getCurrentLayout();
			const maxPosition = layout.panels.length - 1;

			// Valid positions
			expect(() => layoutStore.reorderPanels('alerts', 0)).not.toThrow();
			expect(() => layoutStore.reorderPanels('alerts', maxPosition)).not.toThrow();

			// Edge cases - implementation should handle gracefully
			expect(() => layoutStore.reorderPanels('alerts', -1)).not.toThrow();
			expect(() => layoutStore.reorderPanels('alerts', 999)).not.toThrow();
		});
	});

	describe('Edge Cases', () => {
		it('should handle toggling all panels off', () => {
			const panelIds = [
				'alerts',
				'resources',
				'population',
				'construction',
				'structures',
				'trade',
				'diplomacy'
			];

			for (const id of panelIds) {
				layoutStore.hidePanel(id);
			}

			const layout = layoutStore.getCurrentLayout();
			const allHidden = layout.panels.every((p) => !p.visible);

			expect(allHidden).toBe(true);
		});

		it('should handle collapsing all panels', () => {
			const panelIds = [
				'alerts',
				'resources',
				'population',
				'construction',
				'structures',
				'trade',
				'diplomacy'
			];

			for (const id of panelIds) {
				layoutStore.updatePanel(id, { collapsed: true });
			}

			const layout = layoutStore.getCurrentLayout();
			const allCollapsed = layout.panels.every((p) => p.collapsed);

			expect(allCollapsed).toBe(true);
		});

		it('should handle rapid layout switching', () => {
			const layouts = ['default', 'planning', 'combat', 'mobile'];

			for (const layoutName of layouts) {
				expect(() => layoutStore.loadLayout(layoutName)).not.toThrow();
			}

			const finalLayout = layoutStore.getCurrentLayout();
			expect(finalLayout).toBeDefined();
			expect(finalLayout.layoutName).toBe('Mobile Optimized');
		});

		it('should handle concurrent modifications', () => {
			// Simulate concurrent updates to same panel
			layoutStore.togglePanel('alerts');
			layoutStore.setPanelSize('alerts', 'large');
			layoutStore.updatePanel('alerts', { collapsed: false });
			layoutStore.reorderPanels('alerts', 3);

			const layout = layoutStore.getCurrentLayout();
			const panel = layout.panels.find((p) => p.id === 'alerts');

			expect(panel).toBeDefined();
			expect(panel?.size).toBe('large');
			expect(panel?.collapsed).toBe(false);
			expect(panel?.position).toBe(3);
		});

		it('should handle save/load cycles without data loss', () => {
			// Set up a complex state
			layoutStore.loadLayout('planning');
			layoutStore.setPanelSize('construction', 'large');
			layoutStore.updatePanel('structures', { visible: true, collapsed: false });
			layoutStore.reorderPanels('alerts', 5);

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

			expect(construction?.size).toBe('large');
			expect(structures?.visible).toBe(true);
			expect(structures?.collapsed).toBe(false);
			expect(alerts?.position).toBe(5);
		});
	});
});
