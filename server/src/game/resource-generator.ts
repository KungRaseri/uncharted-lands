/**
 * Advanced resource generation system for plot creation
 *
 * This system generates realistic resource values based on:
 * - Tile elevation (affects solar exposure, wind patterns, resource availability)
 * - Precipitation (affects water, vegetation, soil quality)
 * - Temperature (affects growing conditions, solar efficiency)
 * - Biome modifiers (specific characteristics of each biome type)
 */

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

export interface Tile {
	elevation: number;
	precipitation: number;
	temperature: number;
}

export interface Biome {
	plotAreaMin: number;
	plotAreaMax: number;
	solarModifier: number;
	windModifier: number;
	foodModifier: number;
	waterModifier: number;
	woodModifier: number;
	stoneModifier: number;
	oreModifier: number;
	plotsMin: number;
	plotsMax: number;
	precipitationMin: number;
	precipitationMax: number;
	temperatureMin: number;
	temperatureMax: number;
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
 */
function generateSolar(tile: Tile, biome: Biome): number {
	const { elevation, temperature, precipitation } = tile;
	const baseModifier = biome.solarModifier;

	if (elevation < 0) {
		return Math.max(1, Math.round(baseModifier * 0.3));
	}

	let solar = baseModifier;

	const elevationBonus = Math.min(2, elevation / 20);
	solar += elevationBonus;

	if (temperature >= 15 && temperature <= 30) {
		solar += 1;
	} else if (temperature > 30) {
		solar += 0.5;
	} else if (temperature < 0) {
		solar -= 0.5;
	}

	const precipPenalty = Math.min(1.5, precipitation / 300);
	solar -= precipPenalty;

	const variance = solar * 0.2;
	solar += Math.random() * variance * 2 - variance;

	return Math.max(1, Math.min(10, Math.round(solar)));
}

/**
 * Generate wind potential
 */
function generateWind(tile: Tile, biome: Biome): number {
	const { elevation, temperature, precipitation } = tile;
	const baseModifier = biome.windModifier;

	let wind = baseModifier;

	if (elevation > 25) {
		wind += 2.5;
	} else if (elevation > 15) {
		wind += 1.5;
	} else if (elevation > 5) {
		wind += 0.5;
	} else if (elevation >= 0 && elevation < 5) {
		wind += 1;
	}

	if (elevation < 0) {
		wind += 3;
	}

	const tempAbsoluteDeviation = Math.abs(temperature - 15);
	wind += tempAbsoluteDeviation / 20;

	if (precipitation > 300) {
		wind += 1;
	} else if (precipitation > 200) {
		wind += 0.5;
	}

	const variance = wind * 0.2;
	wind += Math.random() * variance * 2 - variance;

	return Math.max(1, Math.min(10, Math.round(wind)));
}

/**
 * Generate food production potential
 */
function generateFood(tile: Tile, biome: Biome, solar: number): number {
	const { elevation, temperature, precipitation } = tile;
	const baseModifier = biome.foodModifier;

	if (elevation < 0) {
		return Math.max(1, Math.round(baseModifier * 0.4));
	}

	let food = baseModifier;

	if (temperature >= 10 && temperature <= 25) {
		food += 2;
	} else if (temperature >= 5 && temperature < 10) {
		food += 1;
	} else if (temperature > 25 && temperature <= 30) {
		food += 1;
	} else if (temperature < 0) {
		food -= 1;
	} else if (temperature > 35) {
		food -= 1;
	}

	if (precipitation >= 200 && precipitation <= 350) {
		food += 2;
	} else if (precipitation >= 150 && precipitation < 200) {
		food += 1;
	} else if (precipitation > 350) {
		food += 0.5;
	} else if (precipitation < 100) {
		food -= 1.5;
	}

	if (elevation > 0 && elevation < 10) {
		food += 1.5;
	} else if (elevation >= 10 && elevation < 20) {
		food += 0;
	} else if (elevation >= 20) {
		food -= 1;
	}

	if (solar >= 7) {
		food += 1;
	} else if (solar <= 3) {
		food -= 0.5;
	}

	const variance = Math.abs(food) * 0.15;
	food += Math.random() * variance * 2 - variance;

	return Math.max(1, Math.min(10, Math.round(food)));
}

/**
 * Generate water availability
 */
function generateWater(tile: Tile, biome: Biome): number {
	const { elevation, precipitation, temperature } = tile;
	const baseModifier = biome.waterModifier;

	if (elevation < 0) {
		return 10;
	}

	let water = baseModifier;

	if (precipitation >= 300) {
		water += 3;
	} else if (precipitation >= 200) {
		water += 2;
	} else if (precipitation >= 100) {
		water += 1;
	} else if (precipitation < 50) {
		water -= 2;
	}

	if (elevation >= 0 && elevation < 5) {
		water += 1.5;
	} else if (elevation >= 5 && elevation < 15) {
		water += 0.5;
	} else if (elevation >= 25) {
		water -= 0.5;
	}

	if (temperature > 30) {
		water -= 1;
	} else if (temperature < 0) {
		water -= 0.5;
	}

	const variance = water * 0.1;
	water += Math.random() * variance * 2 - variance;

	return Math.max(1, Math.min(10, Math.round(water)));
}

/**
 * Generate wood/timber resources
 */
function generateWood(tile: Tile, biome: Biome): number {
	const { elevation, temperature, precipitation } = tile;
	const baseModifier = biome.woodModifier;

	if (elevation < 0) {
		return 0;
	}

	let wood = baseModifier;

	if (precipitation >= 250) {
		wood += 3;
	} else if (precipitation >= 150) {
		wood += 2;
	} else if (precipitation >= 100) {
		wood += 1;
	} else if (precipitation < 50) {
		wood -= 2;
	}

	if (temperature >= 5 && temperature <= 30) {
		wood += 1.5;
	} else if (temperature < -5) {
		wood -= 1;
	} else if (temperature > 35) {
		wood -= 0.5;
	}

	if (elevation >= 0 && elevation < 20) {
		wood += 1;
	} else if (elevation >= 25) {
		wood -= 1.5;
	}

	const variance = Math.abs(wood) * 0.15;
	wood += Math.random() * variance * 2 - variance;

	return Math.max(0, Math.min(10, Math.round(wood)));
}

/**
 * Generate stone resources
 */
function generateStone(tile: Tile, biome: Biome): number {
	const { elevation, precipitation } = tile;
	const baseModifier = biome.stoneModifier;

	if (elevation < 0) {
		return Math.max(1, Math.round(baseModifier * 0.3));
	}

	let stone = baseModifier;

	if (elevation >= 30) {
		stone += 4;
	} else if (elevation >= 20) {
		stone += 3;
	} else if (elevation >= 10) {
		stone += 2;
	} else if (elevation >= 5) {
		stone += 1;
	} else {
		stone += 0.5;
	}

	if (precipitation < 100) {
		stone += 1.5;
	} else if (precipitation > 300) {
		stone -= 0.5;
	}

	const variance = stone * 0.15;
	stone += Math.random() * variance * 2 - variance;

	return Math.max(1, Math.min(10, Math.round(stone)));
}

/**
 * Generate ore/mineral resources
 */
function generateOre(tile: Tile, biome: Biome): number {
	const { elevation, precipitation } = tile;
	const baseModifier = biome.oreModifier;

	if (elevation < 0) {
		return 0;
	}

	let ore = baseModifier;

	if (elevation >= 25) {
		ore += 3.5;
	} else if (elevation >= 15) {
		ore += 2.5;
	} else if (elevation >= 10) {
		ore += 1.5;
	} else if (elevation < 5) {
		ore -= 0.5;
	}

	if (precipitation < 100) {
		ore += 1;
	} else if (precipitation > 300) {
		ore -= 0.5;
	}

	const variance = ore * 0.25;
	ore += Math.random() * variance * 2 - variance;

	if (ore < 3 && Math.random() < 0.3) {
		ore = 0;
	}

	return Math.max(0, Math.min(10, Math.round(ore)));
}

/**
 * Determine number of plots for a tile based on elevation and biome
 */
export function determinePlotsTotal(tile: Tile, biome: Biome): number {
	const { elevation } = tile;
	const { plotsMin, plotsMax } = biome;

	if (elevation < 0) {
		return 0;
	}

	let plotCount = Math.floor(Math.random() * (plotsMax - plotsMin + 1)) + plotsMin;

	if (elevation < 5) {
		plotCount = Math.ceil(plotCount * 1.2);
	} else if (elevation >= 5 && elevation < 15) {
		// Normal range
	} else if (elevation >= 15 && elevation < 25) {
		plotCount = Math.floor(plotCount * 0.8);
	} else if (elevation >= 25) {
		plotCount = Math.floor(plotCount * 0.6);
	}

	return Math.max(1, Math.min(plotsMax, plotCount));
}
