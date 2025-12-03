/**
 * Resource Generator (Client-Side)
 *
 * ⚠️ DEPRECATED for gameplay use
 *
 * This file is ONLY used by admin tools:
 * - /admin/worlds/create - Custom world generation
 *
 * 🎮 For Gameplay:
 * Server generates all plot resources during world creation automatically.
 * See: server/src/game/resource-generator.ts (fully tested with 15 unit tests)
 *
 * 🚀 Future: Remove when admin tools are migrated to use server generation.
 *
 * ---
 *
 * Advanced resource generation system for plot creation
 *
 * This system generates realistic resource values based on:
 * - Tile elevation (affects solar exposure, wind patterns, resource availability)
 * - Precipitation (affects water, vegetation, soil quality)
 * - Temperature (affects growing conditions, solar efficiency)
 * - Biome modifiers (specific characteristics of each biome type)
 */

// Types simplified after Prisma removal - used only by deprecated admin tools
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Biome = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Tile = any;

export interface PlotResources {
	area: number;
	solar: number;
	wind: number;
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
}

/**
 * Generate all plot resources based on tile characteristics
 */
export function generatePlotResources(tile: Tile, biome: Biome): PlotResources {
	// Generate base area from biome ranges
	const area = generateArea(biome);

	// Generate energy resources (affected by physical conditions)
	const solar = generateSolar(tile, biome);
	const wind = generateWind(tile, biome);

	// Generate natural resources (complex interactions)
	const food = generateFood(tile, biome, solar);
	const water = generateWater(tile, biome);
	const wood = generateWood(tile, biome);
	const stone = generateStone(tile, biome);
	const ore = generateOre(tile, biome);

	return { area, solar, wind, food, water, wood, stone, ore };
}

/**
 * Generate plot area based on biome characteristics
 */
function generateArea(biome: Biome): number {
	const { plotAreaMin, plotAreaMax } = biome;
	return Math.floor(Math.random() * (plotAreaMax - plotAreaMin + 1)) + plotAreaMin;
}

/**
 * Generate solar potential
 *
 * High elevation = more solar (less atmosphere)
 * High temperature = more solar hours
 * High precipitation = cloud cover reduces solar
 * Biome modifier affects base potential
 */
function generateSolar(tile: Tile, biome: Biome): number {
	const { elevation, temperature, precipitation } = tile;
	const baseModifier = biome.solarModifier;

	// Ocean tiles have minimal solar potential
	if (elevation < 0) {
		return Math.max(1, Math.round(baseModifier * 0.3));
	}

	// Start with biome base modifier (1-5 scale)
	let solar = baseModifier;

	// Elevation bonus: Higher elevation = better solar (thinner atmosphere)
	// +0.5 per 10 elevation units (capped at +2)
	const elevationBonus = Math.min(2, elevation / 20);
	solar += elevationBonus;

	// Temperature bonus: Warmer = more sun hours
	// Normalized temp range: -10 to 32 celsius
	// Optimal range: 15-30 celsius
	if (temperature >= 15 && temperature <= 30) {
		solar += 1; // Optimal sun belt
	} else if (temperature > 30) {
		solar += 0.5; // Hot but possibly more cloud formation
	} else if (temperature < 0) {
		solar -= 0.5; // Long winters reduce sun hours
	}

	// Precipitation penalty: More rain = more clouds
	// Normalized precip range: 0-450mm
	const precipPenalty = Math.min(1.5, precipitation / 300);
	solar -= precipPenalty;

	// Add some randomness (±20%)
	const variance = solar * 0.2;
	solar += Math.random() * variance * 2 - variance;

	// Clamp to 1-10 scale
	return Math.max(1, Math.min(10, Math.round(solar)));
}

/**
 * Generate wind potential
 *
 * Higher elevation = more wind exposure
 * Coastal areas = more wind
 * Open plains = more wind
 * Temperature differentials create wind
 */
function generateWind(tile: Tile, biome: Biome): number {
	const { elevation, temperature, precipitation } = tile;
	const baseModifier = biome.windModifier;

	// Start with biome base
	let wind = baseModifier;

	// Elevation effect: Higher = more wind exposure
	if (elevation > 25) {
		wind += 2.5; // Mountain peaks = very windy
	} else if (elevation > 15) {
		wind += 1.5; // Hills = windy
	} else if (elevation > 5) {
		wind += 0.5; // Elevated = some wind
	} else if (elevation >= 0 && elevation < 5) {
		wind += 1; // Coastal lowlands = sea breeze
	}

	// Ocean tiles have maximum wind
	if (elevation < 0) {
		wind += 3;
	}

	// Temperature creates wind through pressure differentials
	// Extreme temps (hot or cold) create more wind
	const tempAbsoluteDeviation = Math.abs(temperature - 15); // 15°C is baseline
	wind += tempAbsoluteDeviation / 20;

	// Precipitation correlates with storm systems (more wind)
	if (precipitation > 300) {
		wind += 1; // Stormy regions
	} else if (precipitation > 200) {
		wind += 0.5;
	}

	// Add randomness (±20%)
	const variance = wind * 0.2;
	wind += Math.random() * variance * 2 - variance;

	// Clamp to 1-10 scale
	return Math.max(1, Math.min(10, Math.round(wind)));
}

/**
 * Generate food production potential
 *
 * Depends on: moderate temperature, adequate water, soil quality
 * Enhanced by: good solar, protection from wind
 */
function generateFood(tile: Tile, biome: Biome, solar: number): number {
	const { elevation, temperature, precipitation } = tile;
	const baseModifier = biome.foodModifier;

	// Ocean tiles have minimal food (fishing only)
	if (elevation < 0) {
		return Math.max(1, Math.round(baseModifier * 0.4));
	}

	let food = baseModifier;

	// Temperature effect: Optimal growing range 10-25°C
	if (temperature >= 10 && temperature <= 25) {
		food += 2; // Optimal growing conditions
	} else if (temperature >= 5 && temperature < 10) {
		food += 1; // Cool but viable
	} else if (temperature > 25 && temperature <= 30) {
		food += 1; // Warm but viable
	} else if (temperature < 0) {
		food -= 1; // Freezing limits growth
	} else if (temperature > 35) {
		food -= 1; // Too hot, crops struggle
	}

	// Precipitation effect: Need adequate water
	// Optimal: 200-350mm
	if (precipitation >= 200 && precipitation <= 350) {
		food += 2; // Perfect rainfall
	} else if (precipitation >= 150 && precipitation < 200) {
		food += 1; // Adequate
	} else if (precipitation > 350) {
		food += 0.5; // Heavy rain can flood crops
	} else if (precipitation < 100) {
		food -= 1.5; // Drought conditions
	}

	// Elevation effect: Lowlands are best for farming
	if (elevation > 0 && elevation < 10) {
		food += 1.5; // River valleys and lowlands
	} else if (elevation >= 10 && elevation < 20) {
		food += 0; // Neutral
	} else if (elevation >= 20) {
		food -= 1; // Mountain farming is difficult
	}

	// Solar helps crops grow
	if (solar >= 7) {
		food += 1;
	} else if (solar <= 3) {
		food -= 0.5;
	}

	// Add randomness (±15%)
	const variance = Math.abs(food) * 0.15;
	food += Math.random() * variance * 2 - variance;

	// Clamp to 1-10 scale
	return Math.max(1, Math.min(10, Math.round(food)));
}

/**
 * Generate water availability
 *
 * Depends on: precipitation, proximity to water, elevation
 */
function generateWater(tile: Tile, biome: Biome): number {
	const { elevation, precipitation, temperature } = tile;
	const baseModifier = biome.waterModifier;

	// Ocean tiles have maximum water (but need desalination)
	if (elevation < 0) {
		return 10;
	}

	let water = baseModifier;

	// Precipitation is primary factor
	if (precipitation >= 300) {
		water += 3; // Very wet
	} else if (precipitation >= 200) {
		water += 2; // Wet
	} else if (precipitation >= 100) {
		water += 1; // Moderate
	} else if (precipitation < 50) {
		water -= 2; // Desert
	}

	// Low elevation = water accumulates
	if (elevation >= 0 && elevation < 5) {
		water += 1.5; // Lowlands collect water
	} else if (elevation >= 5 && elevation < 15) {
		water += 0.5; // Moderate elevation
	} else if (elevation >= 25) {
		water -= 0.5; // Mountains = runoff
	}

	// Temperature affects water retention
	if (temperature > 30) {
		water -= 1; // High evaporation
	} else if (temperature < 0) {
		water -= 0.5; // Frozen water less accessible
	}

	// Add randomness (±10%)
	const variance = water * 0.1;
	water += Math.random() * variance * 2 - variance;

	// Clamp to 1-10 scale
	return Math.max(1, Math.min(10, Math.round(water)));
}

/**
 * Generate wood/timber resources
 *
 * Depends on: precipitation, temperature, elevation
 * Trees need water and moderate temps
 */
function generateWood(tile: Tile, biome: Biome): number {
	const { elevation, temperature, precipitation } = tile;
	const baseModifier = biome.woodModifier;

	// Ocean tiles have no wood
	if (elevation < 0) {
		return 0;
	}

	let wood = baseModifier;

	// Precipitation is key for forests
	if (precipitation >= 250) {
		wood += 3; // Rainforest conditions
	} else if (precipitation >= 150) {
		wood += 2; // Forest conditions
	} else if (precipitation >= 100) {
		wood += 1; // Sparse forest
	} else if (precipitation < 50) {
		wood -= 2; // Desert = minimal trees
	}

	// Temperature range for tree growth: 5-30°C optimal
	if (temperature >= 5 && temperature <= 30) {
		wood += 1.5; // Optimal
	} else if (temperature < -5) {
		wood -= 1; // Tundra = limited trees
	} else if (temperature > 35) {
		wood -= 0.5; // Too hot for most trees
	}

	// Elevation effect: Trees prefer lower to mid elevations
	if (elevation >= 0 && elevation < 20) {
		wood += 1; // Good growing elevation
	} else if (elevation >= 25) {
		wood -= 1.5; // Above tree line
	}

	// Add randomness (±15%)
	const variance = Math.abs(wood) * 0.15;
	wood += Math.random() * variance * 2 - variance;

	// Clamp to 0-10 scale
	return Math.max(0, Math.min(10, Math.round(wood)));
}

/**
 * Generate stone resources
 *
 * High elevation = more exposed rock
 * Low precipitation = less erosion, more surface stone
 */
function generateStone(tile: Tile, biome: Biome): number {
	const { elevation, precipitation } = tile;
	const baseModifier = biome.stoneModifier;

	// Ocean tiles have minimal accessible stone
	if (elevation < 0) {
		return Math.max(1, Math.round(baseModifier * 0.3));
	}

	let stone = baseModifier;

	// Elevation is primary factor: higher = more exposed rock
	if (elevation >= 30) {
		stone += 4; // High mountains = abundant rock
	} else if (elevation >= 20) {
		stone += 3; // Mountains
	} else if (elevation >= 10) {
		stone += 2; // Hills
	} else if (elevation >= 5) {
		stone += 1; // Elevated terrain
	} else {
		stone += 0.5; // Lowlands have some stone
	}

	// Low precipitation = less vegetation/soil covering stone
	if (precipitation < 100) {
		stone += 1.5; // Desert = exposed rock
	} else if (precipitation > 300) {
		stone -= 0.5; // Heavy vegetation covers stone
	}

	// Add randomness (±15%)
	const variance = stone * 0.15;
	stone += Math.random() * variance * 2 - variance;

	// Clamp to 1-10 scale
	return Math.max(1, Math.min(10, Math.round(stone)));
}

/**
 * Generate ore/mineral resources
 *
 * Depends on: elevation (geological exposure), stone availability
 * Higher elevation = more geological activity and exposure
 */
function generateOre(tile: Tile, biome: Biome): number {
	const { elevation, precipitation } = tile;
	const baseModifier = biome.oreModifier;

	// Ocean tiles have no accessible ore
	if (elevation < 0) {
		return 0;
	}

	let ore = baseModifier;

	// Elevation effect: Mountains have best ore deposits
	if (elevation >= 25) {
		ore += 3.5; // Mountain ranges = rich ore
	} else if (elevation >= 15) {
		ore += 2.5; // Hills = good ore
	} else if (elevation >= 10) {
		ore += 1.5; // Moderate elevation
	} else if (elevation < 5) {
		ore -= 0.5; // Lowlands = limited ore
	}

	// Dry areas expose ore deposits
	if (precipitation < 100) {
		ore += 1; // Desert exposes minerals
	} else if (precipitation > 300) {
		ore -= 0.5; // Heavy vegetation/erosion covers deposits
	}

	// Add significant randomness (±25%) - ore deposits are scattered
	const variance = ore * 0.25;
	ore += Math.random() * variance * 2 - variance;

	// Some plots might have no ore at all (30% chance if base is low)
	if (ore < 3 && Math.random() < 0.3) {
		ore = 0;
	}

	// Clamp to 0-10 scale
	return Math.max(0, Math.min(10, Math.round(ore)));
}

/**
 * Determine number of plots for a tile based on elevation and biome
 */
export function determinePlotsTotal(tile: Tile, biome: Biome): number {
	const { elevation } = tile;
	const { plotsMin, plotsMax } = biome;

	// Ocean tiles have no plots
	if (elevation < 0) {
		return 0;
	}

	// Calculate base number from biome range
	let plotCount = Math.floor(Math.random() * (plotsMax - plotsMin + 1)) + plotsMin;

	// Adjust based on elevation and terrain suitability
	// Lowlands = more buildable space
	// Mountains = less buildable space
	if (elevation < 5) {
		plotCount = Math.ceil(plotCount * 1.2); // +20% for lowlands
	} else if (elevation >= 5 && elevation < 15) {
		// Normal range
	} else if (elevation >= 15 && elevation < 25) {
		plotCount = Math.floor(plotCount * 0.8); // -20% for hills
	} else if (elevation >= 25) {
		plotCount = Math.floor(plotCount * 0.6); // -40% for mountains
	}

	// Ensure at least 1 plot on land tiles
	return Math.max(1, Math.min(plotsMax, plotCount));
}
