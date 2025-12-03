import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import ResourceProductionPanel from '$lib/components/resources/ResourceProductionPanel.svelte';
import type { TileWithRelations } from '$lib/types/api';

// Helper function to fix TypeScript issues with Svelte 5 runes and testing-library
// See: https://github.com/testing-library/svelte-testing-library/issues/360
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderComponent(component: any, options: any) {
	return render(component, options);
}

// Mock the utility functions
vi.mock('$lib/utils/resource-production', () => ({
	getResourceIcon: vi.fn((resourceType: string) => {
		const icons: Record<string, string> = {
			FOOD: '🌾',
			WATER: '💧',
			WOOD: '🪵',
			STONE: '🪨',
			ORE: '⛏️'
		};
		return Promise.resolve(icons[resourceType] || '❓');
	}),
	getResourceName: vi.fn((resourceType: string) => {
		const names: Record<string, string> = {
			FOOD: 'Food',
			WATER: 'Water',
			WOOD: 'Wood',
			STONE: 'Stone',
			ORE: 'Ore'
		};
		return Promise.resolve(names[resourceType] || 'Unknown');
	})
}));

describe('ResourceProductionPanel.svelte', () => {
	const baseTile: TileWithRelations = {
		id: 'tile-1',
		regionId: 'region-1',
		x: 10,
		y: 20,
		xCoord: 100,
		yCoord: 200,
		elevation: 50,
		precipitation: 60,
		temperature: 15,
		biomeId: 'biome-1',
		type: 'LAND',
		foodQuality: 50,
		woodQuality: 60,
		stoneQuality: 40,
		oreQuality: 30,
		specialResource: null,
		settlementId: 'settlement-1',
		plotSlots: 3,
		baseProductionModifier: 1,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01')
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render settlement name', async () => {
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Test Settlement Production')).toBeDefined();
			});
		});

		it('should display active tiles count', async () => {
			const producingPlot = { ...baseTile, food: 5 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [producingPlot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/1 of 1 tiles producing resources/)).toBeDefined();
			});
		});

		it('should display total tiles count correctly', async () => {
			const tiles = [
				{ ...baseTile, id: 'plot-1', food: 5 },
				{ ...baseTile, id: 'plot-2', water: 3 },
				{ ...baseTile, id: 'plot-3' }
			];
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/2 of 3 tiles producing resources/)).toBeDefined();
			});
		});
	});

	describe('Harvest All Button', () => {
		it('should show harvest all button when callback provided and tiles are producing', async () => {
			const producingPlot = { ...baseTile, food: 5 };
			const onHarvestAll = vi.fn();
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [producingPlot],
					settlementName: 'Test Settlement',
					onHarvestAll
				}
			});

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /Harvest All/i })).toBeDefined();
			});
		});

		it('should not show harvest all button when no callback provided', async () => {
			const producingPlot = { ...baseTile, food: 5 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [producingPlot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Test Settlement Production')).toBeDefined();
			});

			expect(screen.queryByRole('button', { name: /Harvest All/i })).toBeNull();
		});

		it('should not show harvest all button when no tiles are producing', async () => {
			const onHarvestAll = vi.fn();
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [baseTile],
					settlementName: 'Test Settlement',
					onHarvestAll
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/0 of 1 tiles producing resources/)).toBeDefined();
			});

			expect(screen.queryByRole('button', { name: /Harvest All/i })).toBeNull();
		});

		it('should call onHarvestAll when button clicked', async () => {
			const producingPlot = { ...baseTile, food: 5 };
			const onHarvestAll = vi.fn();
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [producingPlot],
					settlementName: 'Test Settlement',
					onHarvestAll
				}
			});

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /Harvest All/i })).toBeDefined();
			});

			const button = screen.getByRole('button', { name: /Harvest All/i });
			button.click();

			expect(onHarvestAll).toHaveBeenCalledTimes(1);
		});
	});

	describe('Total Production Rates', () => {
		it('should display food production rate', async () => {
			const foodPlot = { ...baseTile, food: 5 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [foodPlot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				const foodElements = screen.getAllByText('Food');
				expect(foodElements.length).toBeGreaterThanOrEqual(1);
				const rateElements = screen.getAllByText('50.0/h');
				expect(rateElements.length).toBeGreaterThanOrEqual(1); // Appears in summary and plot card
			});
		});

		it('should display water production rate', async () => {
			const waterPlot = { ...baseTile, water: 3 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [waterPlot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				const waterElements = screen.getAllByText('Water');
				expect(waterElements.length).toBeGreaterThanOrEqual(1);
				const rateElements = screen.getAllByText('30.0/h');
				expect(rateElements.length).toBeGreaterThanOrEqual(1); // Appears in summary and plot card
			});
		});

		it('should display wood production rate', async () => {
			const woodPlot = { ...baseTile, wood: 8 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [woodPlot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				const woodElements = screen.getAllByText('Wood');
				expect(woodElements.length).toBeGreaterThanOrEqual(1);
				const rateElements = screen.getAllByText('80.0/h');
				expect(rateElements.length).toBeGreaterThanOrEqual(1); // Appears in summary and plot card
			});
		});

		it('should display stone production rate', async () => {
			const stonePlot = { ...baseTile, stone: 6 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [stonePlot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				const stoneElements = screen.getAllByText('Stone');
				expect(stoneElements.length).toBeGreaterThanOrEqual(1);
				const rateElements = screen.getAllByText('60.0/h');
				expect(rateElements.length).toBeGreaterThanOrEqual(1); // Appears in summary and plot card
			});
		});

		it('should display ore production rate', async () => {
			const orePlot = { ...baseTile, ore: 4 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [orePlot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				const oreElements = screen.getAllByText('Ore');
				expect(oreElements.length).toBeGreaterThanOrEqual(1);
				const rateElements = screen.getAllByText('40.0/h');
				expect(rateElements.length).toBeGreaterThanOrEqual(1); // Appears in summary and plot card
			});
		});

		it('should sum production rates from multiple tiles', async () => {
			const tiles = [
				{ ...baseTile, id: 'plot-1', food: 5 },
				{ ...baseTile, id: 'plot-2', food: 3 },
				{ ...baseTile, id: 'plot-3', food: 2 }
			];
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('100.0/h')).toBeDefined(); // (5+3+2) * 10 = 100
			});
		});

		it('should display multiple resource types', async () => {
			const multiResourcePlot = { ...baseTile, food: 5, water: 3, wood: 2 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [multiResourcePlot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				// Resources appear in both summary and plot cards
				const foodElements = screen.getAllByText('Food');
				expect(foodElements.length).toBeGreaterThanOrEqual(1);
				expect(screen.getAllByText('50.0/h')).toBeDefined();
				const waterElements = screen.getAllByText('Water');
				expect(waterElements.length).toBeGreaterThanOrEqual(1);
				expect(screen.getAllByText('30.0/h')).toBeDefined();
				const woodElements = screen.getAllByText('Wood');
				expect(woodElements.length).toBeGreaterThanOrEqual(1);
				expect(screen.getAllByText('20.0/h')).toBeDefined();
			});
		});

		it('should only show resources with production > 0', async () => {
			const tiles = [{ ...baseTile, food: 5 }];
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Food')).toBeDefined();
			});

			expect(screen.queryByText('Water')).toBeNull();
			expect(screen.queryByText('Stone')).toBeNull();
			expect(screen.queryByText('Ore')).toBeNull();
		});
	});

	describe('Active tiles Display', () => {
		it('should display active plot with coordinates', async () => {
			const plot = { ...baseTile, x: 15, y: 25, food: 5 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Plot (15, 25)')).toBeDefined();
			});
		});

		it('should display plot area', async () => {
			const plot = { ...baseTile, area: 10, food: 5 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/Area: 10 units/)).toBeDefined();
			});
		});

		it('should display plot creation date', async () => {
			const plot = { ...baseTile, food: 5, createdAt: new Date('2024-01-15') };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/Created:/)).toBeDefined();
			});
		});

		it('should display individual resource production for plot', async () => {
			const plot = { ...baseTile, food: 5, water: 3 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				// Should appear twice: once in total summary, once in plot card
				const foodElements = screen.getAllByText('Food');
				expect(foodElements.length).toBeGreaterThan(1);
			});
		});

		it('should display active tiles count header', async () => {
			const tiles = [
				{ ...baseTile, id: 'plot-1', food: 5 },
				{ ...baseTile, id: 'plot-2', water: 3 }
			];
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Active tiles (2)')).toBeDefined();
			});
		});
	});

	describe('Idle tiles Display', () => {
		it('should display idle tiles section when tiles exist with no production', async () => {
			const tiles = [
				{ ...baseTile, id: 'plot-1', food: 5 },
				{ ...baseTile, id: 'plot-2' }
			];
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Idle tiles (1)')).toBeDefined();
			});
		});

		it('should display idle plot coordinates', async () => {
			const tiles = [{ ...baseTile, id: 'plot-1', x: 5, y: 10 }];
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Plot at (5, 10)')).toBeDefined();
			});
		});

		it('should show "Add Extractor" button for idle tiles', async () => {
			const tiles = [{ ...baseTile, id: 'plot-1' }];
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /Add Extractor/i })).toBeDefined();
			});
		});

		it('should not show idle tiles section when all tiles are producing', async () => {
			const tiles = [
				{ ...baseTile, id: 'plot-1', food: 5 },
				{ ...baseTile, id: 'plot-2', water: 3 }
			];
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Active tiles (2)')).toBeDefined();
			});

			expect(screen.queryByText(/Idle tiles/)).toBeNull();
		});
	});

	describe('Empty State', () => {
		it('should display empty state when no tiles exist', async () => {
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('No active tiles')).toBeDefined();
				expect(
					screen.getByText('Create tiles on tiles to start producing resources')
				).toBeDefined();
			});
		});

		it('should display empty state when tiles exist but none are producing', async () => {
			const tiles = [
				{ ...baseTile, id: 'plot-1' },
				{ ...baseTile, id: 'plot-2' }
			];
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('No active tiles')).toBeDefined();
			});
		});

		it('should show 0 of N tiles producing when no production', async () => {
			const tiles = [baseTile];
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/0 of 1 tiles producing resources/)).toBeDefined();
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle very large production values', async () => {
			const plot = { ...baseTile, food: 999 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('9990.0/h')).toBeDefined(); // 999 * 10
			});
		});

		it('should handle zero production values', async () => {
			const plot = { ...baseTile, food: 0 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('No active tiles')).toBeDefined();
			});
		});

		it('should handle fractional production values', async () => {
			const plot = { ...baseTile, food: 2.5 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('25.0/h')).toBeDefined(); // 2.5 * 10
			});
		});

		it('should handle empty settlement name', async () => {
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [],
					settlementName: '',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/Production$/)).toBeDefined();
			});
		});

		it('should handle many tiles efficiently', async () => {
			const tiles = Array.from({ length: 50 }, (_, i) => ({
				...baseTile,
				id: `plot-${i}`,
				food: i % 2 === 0 ? 5 : 0
			}));

			renderComponent(ResourceProductionPanel, {
				props: {
					tiles,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/25 of 50 tiles producing resources/)).toBeDefined();
			});
		});
	});

	describe('Loading States', () => {
		it('should show loading state for resource icons', () => {
			const plot = { ...baseTile, food: 5 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			const loadingElements = screen.getAllByText('⏳');
			expect(loadingElements.length).toBeGreaterThan(0);
		});

		it('should show loading text during calculation', () => {
			const plot = { ...baseTile, food: 5 };
			renderComponent(ResourceProductionPanel, {
				props: {
					tiles: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			const loadingElements = screen.getAllByText('Loading...');
			expect(loadingElements.length).toBeGreaterThan(0);
		});
	});
});
