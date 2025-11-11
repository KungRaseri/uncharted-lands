/**
 * Static biome definitions
 * These match the server-side biome data and are used for client-side biome matching
 */

export interface BiomeDefinition {
	name: string;
	precipitationMin: number;
	precipitationMax: number;
	temperatureMin: number;
	temperatureMax: number;
}

/**
 * Biome data matching server seed.ts definitions
 * Note: IDs are omitted since we only need the matching logic, not DB references
 */
export const BIOMES: BiomeDefinition[] = [
	{
		name: 'TUNDRA',
		precipitationMin: 10,
		precipitationMax: 175,
		temperatureMin: -10,
		temperatureMax: 5,
	},
	{
		name: 'FOREST_BOREAL',
		precipitationMin: 25,
		precipitationMax: 300,
		temperatureMin: -5,
		temperatureMax: 10,
	},
	{
		name: 'FOREST_TEMPERATE_SEASONAL',
		precipitationMin: 50,
		precipitationMax: 350,
		temperatureMin: 4,
		temperatureMax: 22,
	},
	{
		name: 'FOREST_TROPICAL_SEASONAL',
		precipitationMin: 50,
		precipitationMax: 350,
		temperatureMin: 20,
		temperatureMax: 32,
	},
	{
		name: 'RAINFOREST_TEMPERATE',
		precipitationMin: 175,
		precipitationMax: 375,
		temperatureMin: 7,
		temperatureMax: 25,
	},
	{
		name: 'RAINFOREST_TROPICAL',
		precipitationMin: 225,
		precipitationMax: 450,
		temperatureMin: 24,
		temperatureMax: 31,
	},
	{
		name: 'WOODLAND',
		precipitationMin: 15,
		precipitationMax: 150,
		temperatureMin: -2,
		temperatureMax: 23,
	},
	{
		name: 'SHRUBLAND',
		precipitationMin: 15,
		precipitationMax: 125,
		temperatureMin: -2,
		temperatureMax: 23,
	},
	{
		name: 'SAVANNA',
		precipitationMin: 50,
		precipitationMax: 275,
		temperatureMin: 22,
		temperatureMax: 32,
	},
	{
		name: 'GRASSLAND_TEMPERATE',
		precipitationMin: 5,
		precipitationMax: 50,
		temperatureMin: -4,
		temperatureMax: 22,
	},
	{
		name: 'DESERT_COLD',
		precipitationMin: 1,
		precipitationMax: 50,
		temperatureMin: -4,
		temperatureMax: 22,
	},
	{
		name: 'DESERT_SUBTROPICAL',
		precipitationMin: 1,
		precipitationMax: 100,
		temperatureMin: 18,
		temperatureMax: 32,
	},
];

/**
 * Display names for biomes (maps internal names to user-friendly names)
 */
export const BIOME_DISPLAY_NAMES: Record<string, string> = {
	TUNDRA: 'Tundra',
	FOREST_BOREAL: 'Boreal Forest',
	FOREST_TEMPERATE_SEASONAL: 'Temperate Forest',
	FOREST_TROPICAL_SEASONAL: 'Tropical Forest',
	RAINFOREST_TEMPERATE: 'Temperate Rainforest',
	RAINFOREST_TROPICAL: 'Rainforest',
	WOODLAND: 'Woodland',
	SHRUBLAND: 'Shrubland',
	SAVANNA: 'Savanna',
	GRASSLAND_TEMPERATE: 'Grassland',
	DESERT_COLD: 'Cold Desert',
	DESERT_SUBTROPICAL: 'Desert',
};

/**
 * Get display name for a biome
 */
export function getBiomeDisplayName(biomeName: string): string {
	return BIOME_DISPLAY_NAMES[biomeName] || biomeName;
}
