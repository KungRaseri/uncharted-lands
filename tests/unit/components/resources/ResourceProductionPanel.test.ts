import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import ResourceProductionPanel from '$lib/components/resources/ResourceProductionPanel.svelte';
import type { PlotWithRelations } from '$lib/types/api';

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
	const basePlot: PlotWithRelations = {
		id: 'plot-1',
		x: 10,
		y: 20,
		area: 5,
		food: 0,
		water: 0,
		wood: 0,
		stone: 0,
		ore: 0,
		solar: 0,
		wind: 0,
		createdAt: new Date('2024-01-01'),
		updatedAt: new Date('2024-01-01'),
		tileId: 'tile-1'
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render settlement name', async () => {
			render(ResourceProductionPanel, {
				props: {
					plots: [],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Test Settlement Production')).toBeDefined();
			});
		});

		it('should display active plots count', async () => {
			const producingPlot = { ...basePlot, food: 5 };
			render(ResourceProductionPanel, {
				props: {
					plots: [producingPlot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/1 of 1 plots producing resources/)).toBeDefined();
			});
		});

		it('should display total plots count correctly', async () => {
			const plots = [
				{ ...basePlot, id: 'plot-1', food: 5 },
				{ ...basePlot, id: 'plot-2', water: 3 },
				{ ...basePlot, id: 'plot-3' }
			];
			render(ResourceProductionPanel, {
				props: {
					plots,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/2 of 3 plots producing resources/)).toBeDefined();
			});
		});
	});

	describe('Harvest All Button', () => {
		it('should show harvest all button when callback provided and plots are producing', async () => {
			const producingPlot = { ...basePlot, food: 5 };
			const onHarvestAll = vi.fn();
			render(ResourceProductionPanel, {
				props: {
					plots: [producingPlot],
					settlementName: 'Test Settlement',
					onHarvestAll
				}
			});

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /Harvest All/i })).toBeDefined();
			});
		});

		it('should not show harvest all button when no callback provided', async () => {
			const producingPlot = { ...basePlot, food: 5 };
			render(ResourceProductionPanel, {
				props: {
					plots: [producingPlot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Test Settlement Production')).toBeDefined();
			});

			expect(screen.queryByRole('button', { name: /Harvest All/i })).toBeNull();
		});

		it('should not show harvest all button when no plots are producing', async () => {
			const onHarvestAll = vi.fn();
			render(ResourceProductionPanel, {
				props: {
					plots: [basePlot],
					settlementName: 'Test Settlement',
					onHarvestAll
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/0 of 1 plots producing resources/)).toBeDefined();
			});

			expect(screen.queryByRole('button', { name: /Harvest All/i })).toBeNull();
		});

		it('should call onHarvestAll when button clicked', async () => {
			const producingPlot = { ...basePlot, food: 5 };
			const onHarvestAll = vi.fn();
			render(ResourceProductionPanel, {
				props: {
					plots: [producingPlot],
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
			const foodPlot = { ...basePlot, food: 5 };
			render(ResourceProductionPanel, {
				props: {
					plots: [foodPlot],
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
			const waterPlot = { ...basePlot, water: 3 };
			render(ResourceProductionPanel, {
				props: {
					plots: [waterPlot],
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
			const woodPlot = { ...basePlot, wood: 8 };
			render(ResourceProductionPanel, {
				props: {
					plots: [woodPlot],
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
			const stonePlot = { ...basePlot, stone: 6 };
			render(ResourceProductionPanel, {
				props: {
					plots: [stonePlot],
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
			const orePlot = { ...basePlot, ore: 4 };
			render(ResourceProductionPanel, {
				props: {
					plots: [orePlot],
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

		it('should sum production rates from multiple plots', async () => {
			const plots = [
				{ ...basePlot, id: 'plot-1', food: 5 },
				{ ...basePlot, id: 'plot-2', food: 3 },
				{ ...basePlot, id: 'plot-3', food: 2 }
			];
			render(ResourceProductionPanel, {
				props: {
					plots,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('100.0/h')).toBeDefined(); // (5+3+2) * 10 = 100
			});
		});

		it('should display multiple resource types', async () => {
			const multiResourcePlot = { ...basePlot, food: 5, water: 3, wood: 2 };
			render(ResourceProductionPanel, {
				props: {
					plots: [multiResourcePlot],
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
			const plots = [{ ...basePlot, food: 5 }];
			render(ResourceProductionPanel, {
				props: {
					plots,
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

	describe('Active Plots Display', () => {
		it('should display active plot with coordinates', async () => {
			const plot = { ...basePlot, x: 15, y: 25, food: 5 };
			render(ResourceProductionPanel, {
				props: {
					plots: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Plot (15, 25)')).toBeDefined();
			});
		});

		it('should display plot area', async () => {
			const plot = { ...basePlot, area: 10, food: 5 };
			render(ResourceProductionPanel, {
				props: {
					plots: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/Area: 10 units/)).toBeDefined();
			});
		});

		it('should display plot creation date', async () => {
			const plot = { ...basePlot, food: 5, createdAt: new Date('2024-01-15') };
			render(ResourceProductionPanel, {
				props: {
					plots: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/Created:/)).toBeDefined();
			});
		});

		it('should display individual resource production for plot', async () => {
			const plot = { ...basePlot, food: 5, water: 3 };
			render(ResourceProductionPanel, {
				props: {
					plots: [plot],
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

		it('should display active plots count header', async () => {
			const plots = [
				{ ...basePlot, id: 'plot-1', food: 5 },
				{ ...basePlot, id: 'plot-2', water: 3 }
			];
			render(ResourceProductionPanel, {
				props: {
					plots,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Active Plots (2)')).toBeDefined();
			});
		});
	});

	describe('Idle Plots Display', () => {
		it('should display idle plots section when plots exist with no production', async () => {
			const plots = [
				{ ...basePlot, id: 'plot-1', food: 5 },
				{ ...basePlot, id: 'plot-2' }
			];
			render(ResourceProductionPanel, {
				props: {
					plots,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Idle Plots (1)')).toBeDefined();
			});
		});

		it('should display idle plot coordinates', async () => {
			const plots = [{ ...basePlot, id: 'plot-1', x: 5, y: 10 }];
			render(ResourceProductionPanel, {
				props: {
					plots,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Plot at (5, 10)')).toBeDefined();
			});
		});

		it('should show "Add Extractor" button for idle plots', async () => {
			const plots = [{ ...basePlot, id: 'plot-1' }];
			render(ResourceProductionPanel, {
				props: {
					plots,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /Add Extractor/i })).toBeDefined();
			});
		});

		it('should not show idle plots section when all plots are producing', async () => {
			const plots = [
				{ ...basePlot, id: 'plot-1', food: 5 },
				{ ...basePlot, id: 'plot-2', water: 3 }
			];
			render(ResourceProductionPanel, {
				props: {
					plots,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('Active Plots (2)')).toBeDefined();
			});

			expect(screen.queryByText(/Idle Plots/)).toBeNull();
		});
	});

	describe('Empty State', () => {
		it('should display empty state when no plots exist', async () => {
			render(ResourceProductionPanel, {
				props: {
					plots: [],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('No active plots')).toBeDefined();
				expect(
					screen.getByText('Create plots on tiles to start producing resources')
				).toBeDefined();
			});
		});

		it('should display empty state when plots exist but none are producing', async () => {
			const plots = [
				{ ...basePlot, id: 'plot-1' },
				{ ...basePlot, id: 'plot-2' }
			];
			render(ResourceProductionPanel, {
				props: {
					plots,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('No active plots')).toBeDefined();
			});
		});

		it('should show 0 of N plots producing when no production', async () => {
			const plots = [basePlot];
			render(ResourceProductionPanel, {
				props: {
					plots,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/0 of 1 plots producing resources/)).toBeDefined();
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle very large production values', async () => {
			const plot = { ...basePlot, food: 999 };
			render(ResourceProductionPanel, {
				props: {
					plots: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('9990.0/h')).toBeDefined(); // 999 * 10
			});
		});

		it('should handle zero production values', async () => {
			const plot = { ...basePlot, food: 0 };
			render(ResourceProductionPanel, {
				props: {
					plots: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('No active plots')).toBeDefined();
			});
		});

		it('should handle fractional production values', async () => {
			const plot = { ...basePlot, food: 2.5 };
			render(ResourceProductionPanel, {
				props: {
					plots: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText('25.0/h')).toBeDefined(); // 2.5 * 10
			});
		});

		it('should handle empty settlement name', async () => {
			render(ResourceProductionPanel, {
				props: {
					plots: [],
					settlementName: '',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/Production$/)).toBeDefined();
			});
		});

		it('should handle many plots efficiently', async () => {
			const plots = Array.from({ length: 50 }, (_, i) => ({
				...basePlot,
				id: `plot-${i}`,
				food: i % 2 === 0 ? 5 : 0
			}));

			render(ResourceProductionPanel, {
				props: {
					plots,
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			await waitFor(() => {
				expect(screen.getByText(/25 of 50 plots producing resources/)).toBeDefined();
			});
		});
	});

	describe('Loading States', () => {
		it('should show loading state for resource icons', () => {
			const plot = { ...basePlot, food: 5 };
			render(ResourceProductionPanel, {
				props: {
					plots: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			const loadingElements = screen.getAllByText('⏳');
			expect(loadingElements.length).toBeGreaterThan(0);
		});

		it('should show loading text during calculation', () => {
			const plot = { ...basePlot, food: 5 };
			render(ResourceProductionPanel, {
				props: {
					plots: [plot],
					settlementName: 'Test Settlement',
					onHarvestAll: undefined
				}
			});

			const loadingElements = screen.getAllByText('Loading...');
			expect(loadingElements.length).toBeGreaterThan(0);
		});
	});
});
