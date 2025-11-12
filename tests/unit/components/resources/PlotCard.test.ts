import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import PlotCard from '$lib/components/resources/PlotCard.svelte';

// Mock the utility functions
vi.mock('$lib/utils/resource-production', () => ({
	getResourceIcon: vi.fn((resourceType: string) => {
		const icons: Record<string, string> = {
			WOOD: '🪵',
			STONE: '🪨',
			ORE: '⛏️',
			WATER: '💧',
			FOOD: '🌾'
		};
		return Promise.resolve(icons[resourceType] || '❓');
	}),
	getResourceName: vi.fn((resourceType: string) => {
		const names: Record<string, string> = {
			WOOD: 'Wood',
			STONE: 'Stone',
			ORE: 'Ore',
			WATER: 'Water',
			FOOD: 'Food'
		};
		return Promise.resolve(names[resourceType] || 'Unknown');
	}),
	getExtractorName: vi.fn((extractorType: string) => {
		const names: Record<string, string> = {
			LUMBERJACK: 'Lumberjack Camp',
			QUARRY: 'Quarry',
			MINE: 'Mine',
			WELL: 'Well',
			FARM: 'Farm'
		};
		return Promise.resolve(names[extractorType] || extractorType);
	}),
	calculateProductionRate: vi.fn(() => Promise.resolve(10.5)),
	calculateAccumulatedResources: vi.fn(() => Promise.resolve(50)),
	formatHarvestTime: vi.fn(() => Promise.resolve('Last harvested 2 hours ago'))
}));

describe('PlotCard.svelte', () => {
	const basePlot = {
		id: 'plot-1',
		resourceType: 'WOOD',
		resourceQuality: 75,
		extractorType: 'LUMBERJACK',
		structureLevel: 3,
		lastHarvested: '2024-01-01T10:00:00Z',
		tileId: 'tile-1',
		tile: {
			biome: {
				name: 'Forest'
			}
		}
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Basic Rendering', () => {
		it('should render resource icon and name', async () => {
			render(PlotCard, { props: { plot: basePlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('🪵')).toBeDefined();
				expect(screen.getByText('Wood')).toBeDefined();
			});
		});

		it('should display structure level badge', async () => {
			render(PlotCard, { props: { plot: basePlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Level 3')).toBeDefined();
			});
		});

		it('should display resource quality', async () => {
			render(PlotCard, { props: { plot: basePlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Quality:')).toBeDefined();
				expect(screen.getByText('75/100')).toBeDefined();
			});
		});

		it('should show loading state while fetching resource info', () => {
			render(PlotCard, { props: { plot: basePlot, onHarvest: null } });

			// Multiple "..." appear during loading (resource icon and extractor name)
			const loadingElements = screen.getAllByText('...');
			expect(loadingElements.length).toBeGreaterThan(0);
		});

		it('should handle unknown resource type with fallback icon', async () => {
			const unknownPlot = { ...basePlot, resourceType: 'UNKNOWN' };
			render(PlotCard, { props: { plot: unknownPlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('❓')).toBeDefined();
				expect(screen.getByText('Unknown')).toBeDefined();
			});
		});
	});

	describe('Different Resource Types', () => {
		it('should render stone resource correctly', async () => {
			const stonePlot = { ...basePlot, resourceType: 'STONE', extractorType: 'QUARRY' };
			render(PlotCard, { props: { plot: stonePlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('🪨')).toBeDefined();
				expect(screen.getByText('Stone')).toBeDefined();
				expect(screen.getByText('Quarry')).toBeDefined();
			});
		});

		it('should render ore resource correctly', async () => {
			const orePlot = { ...basePlot, resourceType: 'ORE', extractorType: 'MINE' };
			render(PlotCard, { props: { plot: orePlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('⛏️')).toBeDefined();
				expect(screen.getByText('Ore')).toBeDefined();
				expect(screen.getByText('Mine')).toBeDefined();
			});
		});

		it('should render water resource correctly', async () => {
			const waterPlot = { ...basePlot, resourceType: 'WATER', extractorType: 'WELL' };
			render(PlotCard, { props: { plot: waterPlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('💧')).toBeDefined();
				expect(screen.getByText('Water')).toBeDefined();
				expect(screen.getByText('Well')).toBeDefined();
			});
		});

		it('should render food resource correctly', async () => {
			const foodPlot = { ...basePlot, resourceType: 'FOOD', extractorType: 'FARM' };
			render(PlotCard, { props: { plot: foodPlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('🌾')).toBeDefined();
				expect(screen.getByText('Food')).toBeDefined();
				expect(screen.getByText('Farm')).toBeDefined();
			});
		});
	});

	describe('Quality Display', () => {
		it('should display low quality correctly', async () => {
			const lowQualityPlot = { ...basePlot, resourceQuality: 25 };
			render(PlotCard, { props: { plot: lowQualityPlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('25/100')).toBeDefined();
			});
		});

		it('should display high quality correctly', async () => {
			const highQualityPlot = { ...basePlot, resourceQuality: 95 };
			render(PlotCard, { props: { plot: highQualityPlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('95/100')).toBeDefined();
			});
		});

		it('should display zero quality', async () => {
			const zeroQualityPlot = { ...basePlot, resourceQuality: 0 };
			render(PlotCard, { props: { plot: zeroQualityPlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('0/100')).toBeDefined();
			});
		});

		it('should display max quality', async () => {
			const maxQualityPlot = { ...basePlot, resourceQuality: 100 };
			render(PlotCard, { props: { plot: maxQualityPlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('100/100')).toBeDefined();
			});
		});
	});

	describe('With Extractor', () => {
		it('should display extractor name', async () => {
			render(PlotCard, { props: { plot: basePlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Extractor:')).toBeDefined();
				expect(screen.getByText('Lumberjack Camp')).toBeDefined();
			});
		});

		it('should display production rate', async () => {
			render(PlotCard, { props: { plot: basePlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Production:')).toBeDefined();
				expect(screen.getByText('10.50/hr')).toBeDefined();
			});
		});

		it('should display accumulated resources', async () => {
			render(PlotCard, { props: { plot: basePlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Accumulated:')).toBeDefined();
				expect(screen.getByText('50')).toBeDefined();
			});
		});

		it('should display harvest time text', async () => {
			render(PlotCard, { props: { plot: basePlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Last harvested 2 hours ago')).toBeDefined();
			});
		});

		it('should show harvest button when resources accumulated and callback provided', async () => {
			const onHarvest = vi.fn();
			render(PlotCard, { props: { plot: basePlot, onHarvest } });

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /Harvest 50 Resources/i })).toBeDefined();
			});
		});

		it('should not show active harvest button when no callback provided', async () => {
			render(PlotCard, { props: { plot: basePlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Accumulated:')).toBeDefined();
			});

			// Should show "No Resources to Harvest" button instead of active harvest button
			// since onHarvest callback is null
			expect(screen.queryByRole('button', { name: /Harvest 50 Resources/i })).toBeNull();
			expect(screen.getByRole('button', { name: /No Resources to Harvest/i })).toBeDefined();
		});

		it('should call onHarvest when harvest button clicked', async () => {
			const onHarvest = vi.fn();
			render(PlotCard, { props: { plot: basePlot, onHarvest } });

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /Harvest 50 Resources/i })).toBeDefined();
			});

			const harvestButton = screen.getByRole('button', { name: /Harvest 50 Resources/i });
			harvestButton.click();

			expect(onHarvest).toHaveBeenCalledTimes(1);
		});

		it('should show disabled button when no resources accumulated', async () => {
			const { calculateAccumulatedResources } = await import('$lib/utils/resource-production');
			vi.mocked(calculateAccumulatedResources).mockResolvedValueOnce(0);

			const onHarvest = vi.fn();
			render(PlotCard, { props: { plot: basePlot, onHarvest } });

			await waitFor(() => {
				expect(screen.getByRole('button', { name: /No Resources to Harvest/i })).toBeDefined();
			});

			const button = screen.getByRole('button', { name: /No Resources to Harvest/i });
			expect(button).toHaveProperty('disabled', true);
		});
	});

	describe('Without Extractor', () => {
		const plotWithoutExtractor = {
			...basePlot,
			extractorType: null
		};

		it('should display message when no extractor', async () => {
			render(PlotCard, { props: { plot: plotWithoutExtractor, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('No extractor built yet')).toBeDefined();
			});
		});

		it('should not show extractor name when no extractor', async () => {
			render(PlotCard, { props: { plot: plotWithoutExtractor, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Wood')).toBeDefined();
			});

			expect(screen.queryByText('Extractor:')).toBeNull();
		});

		it('should not show production rate when no extractor', async () => {
			render(PlotCard, { props: { plot: plotWithoutExtractor, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('No extractor built yet')).toBeDefined();
			});

			expect(screen.queryByText('Production:')).toBeNull();
		});

		it('should not show accumulated resources when no extractor', async () => {
			render(PlotCard, { props: { plot: plotWithoutExtractor, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('No extractor built yet')).toBeDefined();
			});

			expect(screen.queryByText('Accumulated:')).toBeNull();
		});

		it('should not show harvest button when no extractor', async () => {
			const onHarvest = vi.fn();
			render(PlotCard, { props: { plot: plotWithoutExtractor, onHarvest } });

			await waitFor(() => {
				expect(screen.getByText('No extractor built yet')).toBeDefined();
			});

			expect(screen.queryByRole('button', { name: /Harvest/i })).toBeNull();
			expect(onHarvest).not.toHaveBeenCalled();
		});
	});

	describe('Structure Levels', () => {
		it('should display level 1', async () => {
			const level1Plot = { ...basePlot, structureLevel: 1 };
			render(PlotCard, { props: { plot: level1Plot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Level 1')).toBeDefined();
			});
		});

		it('should display level 5', async () => {
			const level5Plot = { ...basePlot, structureLevel: 5 };
			render(PlotCard, { props: { plot: level5Plot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Level 5')).toBeDefined();
			});
		});

		it('should display level 10', async () => {
			const level10Plot = { ...basePlot, structureLevel: 10 };
			render(PlotCard, { props: { plot: level10Plot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Level 10')).toBeDefined();
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle plot without tile biome data', async () => {
			const plotWithoutBiome = {
				...basePlot,
				tile: undefined
			};
			render(PlotCard, { props: { plot: plotWithoutBiome, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Wood')).toBeDefined();
			});
		});

		it('should handle null lastHarvested date', async () => {
			const neverHarvestedPlot = {
				...basePlot,
				lastHarvested: null
			};
			render(PlotCard, { props: { plot: neverHarvestedPlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Accumulated:')).toBeDefined();
			});
		});

		it('should handle level 0 structure', async () => {
			const level0Plot = { ...basePlot, structureLevel: 0 };
			render(PlotCard, { props: { plot: level0Plot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Level 0')).toBeDefined();
			});
		});

		it('should handle very high structure level', async () => {
			const highLevelPlot = { ...basePlot, structureLevel: 99 };
			render(PlotCard, { props: { plot: highLevelPlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Level 99')).toBeDefined();
			});
		});

		it('should handle plot without biome nested properly', async () => {
			const plotNoBiome = {
				...basePlot,
				tile: {}
			};
			render(PlotCard, { props: { plot: plotNoBiome, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('Wood')).toBeDefined();
			});
		});
	});

	describe('Production Calculations', () => {
		it('should call calculateProductionRate with correct parameters', async () => {
			const { calculateProductionRate } = await import('$lib/utils/resource-production');

			render(PlotCard, { props: { plot: basePlot, onHarvest: null } });

			await waitFor(() => {
				expect(calculateProductionRate).toHaveBeenCalledWith({
					resourceType: 'WOOD',
					extractorType: 'LUMBERJACK',
					biomeName: 'Forest',
					structureLevel: 3
				});
			});
		});

		it('should display different production rates', async () => {
			const { calculateProductionRate } = await import('$lib/utils/resource-production');
			vi.mocked(calculateProductionRate).mockResolvedValueOnce(25.75);

			render(PlotCard, { props: { plot: basePlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('25.75/hr')).toBeDefined();
			});
		});

		it('should call calculateAccumulatedResources with correct parameters', async () => {
			const { calculateAccumulatedResources } = await import('$lib/utils/resource-production');

			render(PlotCard, { props: { plot: basePlot, onHarvest: null } });

			await waitFor(() => {
				expect(calculateAccumulatedResources).toHaveBeenCalledWith(
					10.5,
					new Date('2024-01-01T10:00:00Z')
				);
			});
		});

		it('should display different accumulated amounts', async () => {
			const { calculateAccumulatedResources } = await import('$lib/utils/resource-production');
			vi.mocked(calculateAccumulatedResources).mockResolvedValueOnce(150);

			render(PlotCard, { props: { plot: basePlot, onHarvest: null } });

			await waitFor(() => {
				expect(screen.getByText('150')).toBeDefined();
			});
		});
	});
});
