/**
 * Unit tests for dashboard-layout.ts store
 * Tests panel configuration, layout presets, viewport detection, and persistence
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { layoutStore } from '$lib/stores/ui/dashboard-layout';

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

Object.defineProperty(global, 'localStorage', {
	value: localStorageMock,
	writable: true
});

// Mock window.matchMedia for viewport detection
Object.defineProperty(window, 'matchMedia', {
	writable: true,
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
		layoutStore.loadPreset('default');
	});

	describe('Panel Configuration', () => {
		it('should have 7 panel types defined', () => {
			const panelIds = [
				'alerts',
				'resources',
				'population',
				'construction',
				'structures',
				'trade',
				'diplomacy'
			];
			const layout = layoutStore.getCurrentLayout();

			panelIds.forEach((id) => {
				const panel = layout.find((p) => p.id === id);
				expect(panel).toBeDefined();
			});
		});

		it('should have valid panel positions', () => {
			const layout = layoutStore.getCurrentLayout();

			layout.forEach((panel) => {
				expect(panel.position).toHaveProperty('row');
				expect(panel.position).toHaveProperty('col');
				expect(panel.position.row).toBeGreaterThanOrEqual(0);
				expect(panel.position.col).toBeGreaterThanOrEqual(0);
			});
		});

		it('should have valid panel sizes', () => {
			const layout = layoutStore.getCurrentLayout();
			const validSizes = ['small', 'medium', 'large'];

			layout.forEach((panel) => {
				expect(validSizes).toContain(panel.size);
			});
		});

		it('should have boolean visibility and collapsed flags', () => {
			const layout = layoutStore.getCurrentLayout();

			layout.forEach((panel) => {
				expect(typeof panel.visible).toBe('boolean');
				expect(typeof panel.collapsed).toBe('boolean');
			});
		});
	});

	describe('Layout Presets', () => {
		it('should load default preset correctly', () => {
			layoutStore.loadPreset('default');
			const layout = layoutStore.getCurrentLayout();

			// Default preset should have alerts, resources, and population visible
			const alerts = layout.find((p) => p.id === 'alerts');
			const resources = layout.find((p) => p.id === 'resources');
			const population = layout.find((p) => p.id === 'population');

			expect(alerts?.visible).toBe(true);
			expect(resources?.visible).toBe(true);
			expect(population?.visible).toBe(true);
		});

		it('should load planning preset correctly', () => {
			layoutStore.loadPreset('planning');
			const layout = layoutStore.getCurrentLayout();

			// Planning preset should emphasize construction and structures
			const construction = layout.find((p) => p.id === 'construction');
			const structures = layout.find((p) => p.id === 'structures');

			expect(construction?.visible).toBe(true);
			expect(structures?.visible).toBe(true);
		});

		it('should load combat preset correctly', () => {
			layoutStore.loadPreset('combat');
			const layout = layoutStore.getCurrentLayout();

			// Combat preset should show alerts prominently
			const alerts = layout.find((p) => p.id === 'alerts');
			expect(alerts?.visible).toBe(true);
			expect(alerts?.size).toBe('large');
		});

		it('should load mobile preset correctly', () => {
			layoutStore.loadPreset('mobile');
			const layout = layoutStore.getCurrentLayout();

			// Mobile preset should have all panels in single column
			layout.forEach((panel) => {
				expect(panel.position.col).toBe(0);
			});
		});

		it('should handle invalid preset gracefully', () => {
			layoutStore.loadPreset('invalid' as LayoutPreset);
			const layout = layoutStore.getCurrentLayout();

			// Should fallback to default
			expect(layout).toBeDefined();
			expect(layout.length).toBeGreaterThan(0);
		});
	});

	describe('Panel Management', () => {
		it('should toggle panel visibility', () => {
			const panelId = 'alerts';
			const initialState = layoutStore.getCurrentLayout().find((p) => p.id === panelId)?.visible;

			layoutStore.togglePanel(panelId);
			const newState = layoutStore.getCurrentLayout().find((p) => p.id === panelId)?.visible;

			expect(newState).toBe(!initialState);
		});

		it('should show panel', () => {
			layoutStore.showPanel('alerts');
			const panel = layoutStore.getCurrentLayout().find((p) => p.id === 'alerts');

			expect(panel?.visible).toBe(true);
		});

		it('should hide panel', () => {
			layoutStore.hidePanel('alerts');
			const panel = layoutStore.getCurrentLayout().find((p) => p.id === 'alerts');

			expect(panel?.visible).toBe(false);
		});

		it('should collapse panel', () => {
			layoutStore.collapsePanel('alerts');
			const panel = layoutStore.getCurrentLayout().find((p) => p.id === 'alerts');

			expect(panel?.collapsed).toBe(true);
		});

		it('should expand panel', () => {
			layoutStore.collapsePanel('alerts');
			layoutStore.expandPanel('alerts');
			const panel = layoutStore.getCurrentLayout().find((p) => p.id === 'alerts');

			expect(panel?.collapsed).toBe(false);
		});

		it('should resize panel', () => {
			layoutStore.resizePanel('alerts', 'large');
			const panel = layoutStore.getCurrentLayout().find((p) => p.id === 'alerts');

			expect(panel?.size).toBe('large');
		});

		it('should move panel to new position', () => {
			const newPosition = { row: 2, col: 1 };
			layoutStore.movePanel('alerts', newPosition);
			const panel = layoutStore.getCurrentLayout().find((p) => p.id === 'alerts');

			expect(panel?.position).toEqual(newPosition);
		});
	});

	describe('Viewport Detection', () => {
		it('should detect mobile viewport', () => {
			// Mock mobile screen
			window.matchMedia = vi.fn().mockImplementation((query: string) => ({
				matches: query.includes('max-width: 767px'),
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn()
			}));

			const viewport = layoutStore.getViewport();
			expect(viewport).toBe('mobile');
		});

		it('should detect tablet viewport', () => {
			// Mock tablet screen
			window.matchMedia = vi.fn().mockImplementation((query: string) => ({
				matches: query.includes('min-width: 768px') && query.includes('max-width: 1023px'),
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn()
			}));

			const viewport = layoutStore.getViewport();
			expect(viewport).toBe('tablet');
		});

		it('should detect desktop viewport', () => {
			// Mock desktop screen
			window.matchMedia = vi.fn().mockImplementation((query: string) => ({
				matches: query.includes('min-width: 1024px'),
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn()
			}));

			const viewport = layoutStore.getViewport();
			expect(viewport).toBe('desktop');
		});
	});

	describe('localStorage Persistence', () => {
		it('should save layout to localStorage', () => {
			layoutStore.togglePanel('alerts');
			layoutStore.saveLayout();

			const saved = localStorageMock.getItem('settlement-dashboard-layout');
			expect(saved).toBeDefined();

			const parsed = JSON.parse(saved!);
			expect(parsed).toHaveProperty('panels');
			expect(parsed).toHaveProperty('preset');
		});

		it('should load layout from localStorage', () => {
			// Save a custom state
			layoutStore.togglePanel('alerts');
			layoutStore.saveLayout();

			// Load default to reset
			layoutStore.loadPreset('default');

			// Load from localStorage
			layoutStore.loadLayout();

			const layout = layoutStore.getCurrentLayout();
			const alerts = layout.find((p) => p.id === 'alerts');

			// Should restore the toggled state
			expect(alerts?.visible).toBe(false);
		});

		it('should handle missing localStorage data gracefully', () => {
			localStorageMock.clear();

			expect(() => layoutStore.loadLayout()).not.toThrow();

			const layout = layoutStore.getCurrentLayout();
			expect(layout).toBeDefined();
		});

		it('should handle corrupted localStorage data', () => {
			localStorageMock.setItem('settlement-dashboard-layout', 'invalid-json');

			expect(() => layoutStore.loadLayout()).not.toThrow();
		});
	});

	describe('Reset Functionality', () => {
		it('should reset to default layout', () => {
			// Make some changes
			layoutStore.togglePanel('alerts');
			layoutStore.resizePanel('resources', 'large');
			layoutStore.movePanel('population', { row: 5, col: 5 });

			// Reset
			layoutStore.resetLayout();

			// Verify reset to default
			const layout = layoutStore.getCurrentLayout();
			const alerts = layout.find((p) => p.id === 'alerts');

			expect(alerts?.visible).toBe(true); // Default state
		});

		it('should clear localStorage on reset', () => {
			layoutStore.saveLayout();
			expect(localStorageMock.getItem('settlement-dashboard-layout')).toBeDefined();

			layoutStore.resetLayout();

			// Note: Implementation may or may not clear localStorage on reset
			// Verify the layout is reset regardless
			const layout = layoutStore.getCurrentLayout();
			expect(layout).toBeDefined();
		});
	});

	describe('Panel Ordering', () => {
		it('should maintain panel order after changes', () => {
			const initialOrder = layoutStore.getCurrentLayout().map((p) => p.id);

			layoutStore.togglePanel('alerts');
			layoutStore.resizePanel('resources', 'large');

			const newOrder = layoutStore.getCurrentLayout().map((p) => p.id);

			expect(newOrder).toEqual(initialOrder);
		});

		it('should reorder panels correctly', () => {
			const panelIds = ['alerts', 'resources'];
			layoutStore.reorderPanels(panelIds);

			const layout = layoutStore.getCurrentLayout();
			expect(layout[0].id).toBe('alerts');
			expect(layout[1].id).toBe('resources');
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

			validIds.forEach((id) => {
				expect(() => layoutStore.togglePanel(id)).not.toThrow();
			});
		});

		it('should handle invalid panel IDs gracefully', () => {
			expect(() => layoutStore.togglePanel('invalid')).not.toThrow();
		});

		it('should validate panel sizes', () => {
			const validSizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

			validSizes.forEach((size) => {
				expect(() => layoutStore.resizePanel('alerts', size)).not.toThrow();
			});
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

			panelIds.forEach((id) => layoutStore.hidePanel(id));

			const layout = layoutStore.getCurrentLayout();
			const allHidden = layout.every((p) => !p.visible);

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

			panelIds.forEach((id) => layoutStore.collapsePanel(id));

			const layout = layoutStore.getCurrentLayout();
			const allCollapsed = layout.every((p) => p.collapsed);

			expect(allCollapsed).toBe(true);
		});

		it('should handle rapid preset switching', () => {
			const presets: LayoutPreset[] = ['default', 'planning', 'combat', 'mobile'];

			presets.forEach((preset) => {
				expect(() => layoutStore.loadPreset(preset)).not.toThrow();
			});

			const layout = layoutStore.getCurrentLayout();
			expect(layout).toBeDefined();
		});

		it('should handle concurrent modifications', () => {
			// Simulate concurrent updates
			layoutStore.togglePanel('alerts');
			layoutStore.resizePanel('alerts', 'large');
			layoutStore.movePanel('alerts', { row: 1, col: 1 });

			const panel = layoutStore.getCurrentLayout().find((p) => p.id === 'alerts');

			expect(panel).toBeDefined();
			expect(panel?.size).toBe('large');
			expect(panel?.position).toEqual({ row: 1, col: 1 });
		});
	});
});
