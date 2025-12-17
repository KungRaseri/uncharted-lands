/**
 * Resource Quality Assignment
 *
 * Calculates resource quality values for tiles based on biome match
 * Quality ranges from 0-100 and represents how good a tile is for each resource type
 */

interface Biome {
	id: string;
	name: string;
	foodModifier: number;
	waterModifier: number;
	woodModifier: number;
	stoneModifier: number;
	oreModifier: number;
	plotsMin: number;
	plotsMax: number;
}

interface ResourceQuality {
	foodQuality: number;
	waterQuality: number;
	woodQuality: number;
	stoneQuality: number;
	oreQuality: number;
}

/**
 * Calculate resource quality for a tile based on its biome
 *
 * Quality is based on the biome's modifier for each resource:
 * - Base quality = modifier * 10 (maps modifier range ~0-10 to 0-100)
 * - Add random variance ±15 points for natural variation
 * - Clamp to 0-100 range
 *
 * FIX (December 9, 2025): Use independent variance per resource
 * - Old bug: Same variance applied to all 5 resources
 * - New: Each resource gets unique variance from seed
 */
export function calculateResourceQuality(
	biome: Biome,
	seed: number = Math.random()
): ResourceQuality {
	// Generate unique variance for each resource based on seed
	// Use different multipliers to ensure independence
	const foodVariance = Math.sin(seed * 1.1) * 30 - 15; // ±15 variation
	const waterVariance = Math.sin(seed * 2.3) * 30 - 15;
	const woodVariance = Math.sin(seed * 3.7) * 30 - 15;
	const stoneVariance = Math.sin(seed * 5.1) * 30 - 15;
	const oreVariance = Math.sin(seed * 7.9) * 30 - 15;

	const foodBase = Math.min(100, biome.foodModifier * 10);
	const waterBase = Math.min(100, biome.waterModifier * 10);
	const woodBase = Math.min(100, biome.woodModifier * 10);
	const stoneBase = Math.min(100, biome.stoneModifier * 10);
	const oreBase = Math.min(100, biome.oreModifier * 10);

	return {
		foodQuality: Math.max(0, Math.min(100, foodBase + foodVariance)),
		waterQuality: Math.max(0, Math.min(100, waterBase + waterVariance)),
		woodQuality: Math.max(0, Math.min(100, woodBase + woodVariance)),
		stoneQuality: Math.max(0, Math.min(100, stoneBase + stoneVariance)),
		oreQuality: Math.max(0, Math.min(100, oreBase + oreVariance)),
	};
}

/**
 * Calculate how many plot slots a tile can support based on biome
 */
export function calculatePlotSlots(biome: Biome): number {
	const avgPlots = Math.floor((biome.plotsMin + biome.plotsMax) / 2);
	return Math.max(3, Math.min(5, avgPlots)); // Clamp between 3-5
}

/**
 * Determine if a tile should have a special resource
 *
 * Special resources appear on ~2% of appropriate biome tiles:
 * - GEMS: Mountains, Desert (stone/ore rich biomes)
 * - EXOTIC_WOOD: Tropical Rainforest, Temperate Forest
 * - MAGICAL_HERBS: Any biome with high food modifier (>7)
 * - ANCIENT_STONE: Mountains only (very rare)
 */
export function determineSpecialResource(
	biome: Biome,
	seed: number = Math.random()
): 'GEMS' | 'EXOTIC_WOOD' | 'MAGICAL_HERBS' | 'ANCIENT_STONE' | null {
	// Only 2% of tiles get special resources
	if (seed > 0.98) return null;

	const biomeName = biome.name.toLowerCase();
	const chance = seed * 100;

	// GEMS in mountains/desert (20% of special tiles)
	if (chance < 20 && (biomeName.includes('mountain') || biomeName.includes('desert'))) {
		return biome.oreModifier >= 7 ? 'GEMS' : null;
	}

	// EXOTIC_WOOD in forests (40% of special tiles)
	if (chance < 60 && (biomeName.includes('forest') || biomeName.includes('rainforest'))) {
		return biome.woodModifier >= 7 ? 'EXOTIC_WOOD' : null;
	}

	// MAGICAL_HERBS in fertile areas (30% of special tiles)
	if (chance < 90 && biome.foodModifier >= 7) {
		return 'MAGICAL_HERBS';
	}

	// ANCIENT_STONE in mountains only (10% of special tiles, very rare)
	if (biomeName.includes('mountain') && biome.stoneModifier >= 8) {
		return 'ANCIENT_STONE';
	}

	return null;
}
