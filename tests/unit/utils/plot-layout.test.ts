import { describe, it, expect } from 'vitest';
import {
	calculatePlotStats,
	getPlotTooltip,
	getPlotLayout,
	type Plot,
} from '../../../src/lib/utils/plot-layout';

// Helper to create mock plots
function createMockPlot(overrides: Partial<Plot> = {}): Plot {
	return {
		id: '12345678-1234-1234-1234-123456789012',
		area: 100,
		solar: 50,
		wind: 30,
		food: 10,
		water: 20,
		wood: 15,
		stone: 25,
		ore: 5,
		settlement: undefined,
		...overrides
	};
}

describe('Plot Layout Utilities', () => {

	describe('calculatePlotStats', () => {
		it('should return zero stats for empty array', () => {
			const stats = calculatePlotStats([]);
			expect(stats.totalPlots).toBe(0);
			expect(stats.totalArea).toBe(0);
			expect(stats.withSettlements).toBe(0);
			expect(stats.avgSolar).toBe(0);
			expect(stats.avgWind).toBe(0);
		});

		it('should calculate stats for single plot', () => {
			const plot = createMockPlot({ area: 150, solar: 60, wind: 40 });
			const stats = calculatePlotStats([plot]);
			
			expect(stats.totalPlots).toBe(1);
			expect(stats.totalArea).toBe(150);
			expect(stats.withSettlements).toBe(0);
			expect(stats.avgSolar).toBe(60);
			expect(stats.avgWind).toBe(40);
		});

		it('should calculate stats for multiple plots', () => {
			const plots = [
				createMockPlot({ area: 100, solar: 50, wind: 30 }),
				createMockPlot({ area: 200, solar: 70, wind: 50 }),
				createMockPlot({ area: 150, solar: 60, wind: 40 })
			];
			const stats = calculatePlotStats(plots);
			
			expect(stats.totalPlots).toBe(3);
			expect(stats.totalArea).toBe(450);
			expect(stats.withSettlements).toBe(0);
			expect(stats.avgSolar).toBe(60); // (50 + 70 + 60) / 3
			expect(stats.avgWind).toBe(40); // (30 + 50 + 40) / 3
		});

		it('should count settlements correctly', () => {
			const plots = [
				createMockPlot({ settlement: { name: 'Settlement 1' } as any }),
				createMockPlot({ settlement: undefined }),
				createMockPlot({ settlement: { name: 'Settlement 2' } as any })
			];
			const stats = calculatePlotStats(plots);
			
			expect(stats.withSettlements).toBe(2);
		});

		it('should handle plots with zero values', () => {
			const plots = [
				createMockPlot({ area: 0, solar: 0, wind: 0 })
			];
			const stats = calculatePlotStats(plots);
			
			expect(stats.totalArea).toBe(0);
			expect(stats.avgSolar).toBe(0);
			expect(stats.avgWind).toBe(0);
		});

		it('should calculate correct averages with different values', () => {
			const plots = [
				createMockPlot({ solar: 100, wind: 80 }),
				createMockPlot({ solar: 0, wind: 0 }),
				createMockPlot({ solar: 50, wind: 40 })
			];
			const stats = calculatePlotStats(plots);
			
			expect(stats.avgSolar).toBe(50); // (100 + 0 + 50) / 3
			expect(stats.avgWind).toBe(40); // (80 + 0 + 40) / 3
		});
	});

	describe('getPlotTooltip', () => {
		it('should format tooltip for plot without settlement', () => {
			const plot = createMockPlot({
				id: 'abcd1234-5678-90ab-cdef-1234567890ab',
				area: 150,
				solar: 60,
				wind: 45,
				food: 12,
				water: 25,
				wood: 18,
				stone: 30,
				ore: 8
			});
			
			const tooltip = getPlotTooltip(plot);
			
			expect(tooltip).toContain('Plot abcd1234');
			expect(tooltip).toContain('Area: 150 m²');
			expect(tooltip).toContain('Solar: 60 | Wind: 45');
			expect(tooltip).toContain('🌾12');
			expect(tooltip).toContain('💧25');
			expect(tooltip).toContain('🪵18');
			expect(tooltip).toContain('🪨30');
			expect(tooltip).toContain('⛏️8');
			expect(tooltip).toContain('No Settlement');
		});

		it('should format tooltip for plot with settlement', () => {
			const plot = createMockPlot({
				settlement: { name: 'Test Settlement' } as any
			});
			
			const tooltip = getPlotTooltip(plot);
			
			expect(tooltip).toContain('🏠 Has Settlement');
			expect(tooltip).not.toContain('No Settlement');
		});

		it('should truncate plot ID to 8 characters', () => {
			const plot = createMockPlot({
				id: '12345678901234567890'
			});
			
			const tooltip = getPlotTooltip(plot);
			
			expect(tooltip).toContain('Plot 12345678');
			expect(tooltip).not.toContain('12345678901234567890');
		});

		it('should handle short plot IDs', () => {
			const plot = createMockPlot({
				id: '123'
			});
			
			const tooltip = getPlotTooltip(plot);
			
			expect(tooltip).toContain('Plot 123');
		});

		it('should format all resource types', () => {
			const plot = createMockPlot({
				food: 5,
				water: 10,
				wood: 15,
				stone: 20,
				ore: 25
			});
			
			const tooltip = getPlotTooltip(plot);
			
			expect(tooltip).toContain('Resources: 🌾5 💧10 🪵15 🪨20 ⛏️25');
		});
	});

	describe('getPlotLayout', () => {
		it('should return empty array for no plots', () => {
			const layout = getPlotLayout([]);
			expect(layout).toEqual([]);
		});

		it('should layout single plot to fill entire space', () => {
			const plot = createMockPlot({ area: 100 });
			const layout = getPlotLayout([plot]);
			
			expect(layout).toHaveLength(1);
			expect(layout[0].plot).toBe(plot);
			expect(layout[0].top).toBe(0);
			expect(layout[0].left).toBe(0);
			expect(layout[0].width).toBe(100);
			expect(layout[0].height).toBe(100);
			expect(layout[0].scale).toBe(1); // areaProportion (1) * plots.length (1)
		});

		it('should layout two plots side by side', () => {
			const plot1 = createMockPlot({ area: 100 });
			const plot2 = createMockPlot({ area: 100 });
			const layout = getPlotLayout([plot1, plot2]);
			
			expect(layout).toHaveLength(2);
			
			// First plot (left side)
			expect(layout[0].top).toBe(0);
			expect(layout[0].left).toBe(0);
			expect(layout[0].width).toBe(50); // 1/2 columns
			expect(layout[0].height).toBe(100);
			
			// Second plot (right side)
			expect(layout[1].top).toBe(0);
			expect(layout[1].left).toBe(50);
			expect(layout[1].width).toBe(50);
			expect(layout[1].height).toBe(100);
		});

		it('should layout four plots in 2x2 grid', () => {
			const plots = [
				createMockPlot({ area: 100 }),
				createMockPlot({ area: 100 }),
				createMockPlot({ area: 100 }),
				createMockPlot({ area: 100 })
			];
			const layout = getPlotLayout(plots);
			
			expect(layout).toHaveLength(4);
			
			// Each plot should be 50% width and 50% height (2x2 grid)
			for (const item of layout) {
				expect(item.width).toBe(50);
				expect(item.height).toBe(50);
			}
			
			// Check positions form a grid
			expect(layout[0].top).toBe(0);
			expect(layout[0].left).toBe(0);
			expect(layout[1].top).toBe(0);
			expect(layout[1].left).toBe(50);
			expect(layout[2].top).toBe(50);
			expect(layout[2].left).toBe(0);
			expect(layout[3].top).toBe(50);
			expect(layout[3].left).toBe(50);
		});

		it('should calculate scale based on area proportion', () => {
			const plots = [
				createMockPlot({ area: 200 }), // Larger plot
				createMockPlot({ area: 100 })  // Smaller plot
			];
			const layout = getPlotLayout(plots);
			
			// First plot has 2/3 of total area (200/300)
			// scale = (200/300) * 2 = 1.333... but capped at 1.2
			expect(layout[0].scale).toBe(1.2);
			
			// Second plot has 1/3 of total area (100/300)
			// scale = (100/300) * 2 = 0.666...
			expect(layout[1].scale).toBeCloseTo(0.667, 2);
		});

		it('should constrain scale between 0.6 and 1.2', () => {
			const plots = [
				createMockPlot({ area: 1000 }), // Very large
				createMockPlot({ area: 10 }),   // Very small
				createMockPlot({ area: 10 })
			];
			const layout = getPlotLayout(plots);
			
			// All scales should be between 0.6 and 1.2
			for (const item of layout) {
				expect(item.scale).toBeGreaterThanOrEqual(0.6);
				expect(item.scale).toBeLessThanOrEqual(1.2);
			}
		});

		it('should layout nine plots in 3x3 grid', () => {
			const plots = Array.from({ length: 9 }, () => createMockPlot({ area: 100 }));
			const layout = getPlotLayout(plots);
			
			expect(layout).toHaveLength(9);
			
			// Each plot should be ~33.33% width and height (3x3 grid)
			for (const item of layout) {
				expect(item.width).toBeCloseTo(33.33, 1);
				expect(item.height).toBeCloseTo(33.33, 1);
			}
		});

		it('should maintain plot reference in layout', () => {
			const plot1 = createMockPlot({ id: 'plot-1' });
			const plot2 = createMockPlot({ id: 'plot-2' });
			const layout = getPlotLayout([plot1, plot2]);
			
			expect(layout[0].plot).toBe(plot1);
			expect(layout[1].plot).toBe(plot2);
		});

		it('should handle single plot with large area', () => {
			const plot = createMockPlot({ area: 10000 });
			const layout = getPlotLayout([plot]);
			
			expect(layout[0].scale).toBe(1); // (10000/10000) * 1 = 1
		});

		it('should handle three plots layout', () => {
			const plots = [
				createMockPlot({ area: 100 }),
				createMockPlot({ area: 100 }),
				createMockPlot({ area: 100 })
			];
			const layout = getPlotLayout(plots);
			
			// sqrt(3) = 1.73, ceil = 2, so 2 columns
			expect(layout).toHaveLength(3);
			expect(layout[0].width).toBe(50); // 1/2 columns
			expect(layout[1].width).toBe(50);
			expect(layout[2].width).toBe(50);
		});
	});
});
