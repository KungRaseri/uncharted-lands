/**
 * Plot layout and statistics utilities
 * Handles plot positioning, tooltips, and statistics calculations
 */

/**
 * Plot type definition
 */
export type Plot = {
	id: string;
	area: number;
	solar: number;
	wind: number;
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
	Settlement?: any;
};

/**
 * Plot layout result with position and size information
 */
export type PlotLayout = {
	plot: Plot;
	top: number;
	left: number;
	width: number;
	height: number;
	scale: number;
};

/**
 * Plot statistics result
 */
export type PlotStats = {
	totalPlots: number;
	totalArea: number;
	withSettlements: number;
	avgSolar: number;
	avgWind: number;
};

/**
 * Calculate plot statistics from an array of plots
 * 
 * @param plots - Array of plots to analyze
 * @returns Object containing plot statistics
 */
export function calculatePlotStats(plots: Plot[]): PlotStats {
	const totalPlots = plots.length;
	const totalArea = plots.reduce((sum, p) => sum + p.area, 0);
	const withSettlements = plots.filter((p) => p.Settlement).length;
	const avgSolar = totalPlots > 0 ? plots.reduce((sum, p) => sum + p.solar, 0) / totalPlots : 0;
	const avgWind = totalPlots > 0 ? plots.reduce((sum, p) => sum + p.wind, 0) / totalPlots : 0;

	return {
		totalPlots,
		totalArea,
		withSettlements,
		avgSolar,
		avgWind
	};
}

/**
 * Generate a tooltip string for a plot
 * Shows plot ID, area, solar/wind, resources, and settlement status
 * 
 * @param plot - The plot to generate tooltip for
 * @returns Formatted tooltip string with newlines
 */
export function getPlotTooltip(plot: Plot): string {
	return `Plot ${plot.id.substring(0, 8)}
Area: ${plot.area} m²
Solar: ${plot.solar} | Wind: ${plot.wind}
Resources: 🌾${plot.food} 💧${plot.water} 🪵${plot.wood} 🪨${plot.stone} ⛏️${plot.ore}
${plot.Settlement ? '🏠 Has Settlement' : 'No Settlement'}`;
}

/**
 * Calculate plot layout positions and sizes for grid visualization
 * Arranges plots in a grid pattern within a tile, with positions as percentages
 * 
 * @param plots - Array of plots to layout
 * @returns Array of plot layouts with position, size, and scale information
 */
export function getPlotLayout(plots: Plot[]): PlotLayout[] {
	if (plots.length === 0) {
		return [];
	}

	const totalArea = plots.reduce((sum, p) => sum + p.area, 0);
	
	return plots.map((plot, index) => {
		// Calculate position based on index and area proportion
		const areaProportion = plot.area / totalArea;
		const cols = Math.ceil(Math.sqrt(plots.length));
		const row = Math.floor(index / cols);
		const col = index % cols;
		
		return {
			plot,
			// Position as percentage (grid layout)
			top: (row / Math.ceil(plots.length / cols)) * 100,
			left: (col / cols) * 100,
			// Size as percentage (with some variation based on area)
			width: (1 / cols) * 100,
			height: (1 / Math.ceil(plots.length / cols)) * 100,
			// Visual size indicator - constrained between 0.6 and 1.2
			scale: Math.max(0.6, Math.min(1.2, areaProportion * plots.length))
		};
	});
}
