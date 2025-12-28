/**
 * Game Configuration Client
 *
 * Fetches and caches game configuration from the server API.
 * This ensures client and server use the same game balance values.
 */

import { PUBLIC_CLIENT_API_URL } from '$env/static/public';
import type { GameConfig } from '@uncharted-lands/shared';
import { logger } from '$lib/utils/logger';

let cachedConfig: GameConfig | null = null;
let configPromise: Promise<GameConfig> | null = null;

/**
 * Fetch game configuration from server
 * Uses in-memory cache to avoid repeated fetches
 */
export async function getGameConfig(): Promise<GameConfig> {
	// Return cached config if available
	if (cachedConfig) {
		return cachedConfig;
	}

	// If already fetching, return existing promise
	if (configPromise) {
		return configPromise;
	}

	// Fetch fresh config
	configPromise = (async () => {
		try {
			const response = await fetch(`${PUBLIC_CLIENT_API_URL}/config/game`);
			if (!response.ok) {
				throw new Error(`Failed to fetch game config: ${response.statusText}`);
			}
			const config = await response.json();
			cachedConfig = config;
			return config;
		} catch (error) {
			logger.error('Failed to load game configuration:', error);
			// Return fallback config if fetch fails
			return getFallbackConfig();
		} finally {
			configPromise = null;
		}
	})();

	return configPromise;
}

/**
 * Invalidate cached config (call when config version changes)
 */
export function invalidateConfigCache(): void {
	cachedConfig = null;
}

/**
 * Fallback configuration if server fetch fails
 * Should match DEFAULT_GAME_CONFIG from server
 */
function getFallbackConfig(): GameConfig {
	return {
		productionRates: [
			{ resourceType: 'FOOD', extractorType: 'FARM', baseRate: 10 },
			{ resourceType: 'WOOD', extractorType: 'LUMBER_MILL', baseRate: 8 },
			{ resourceType: 'STONE', extractorType: 'QUARRY', baseRate: 6 },
			{ resourceType: 'ORE', extractorType: 'MINE', baseRate: 4 },
			{ resourceType: 'CLAY', extractorType: 'QUARRY', baseRate: 3 },
			{ resourceType: 'HERBS', extractorType: 'HERB_GARDEN', baseRate: 5 },
			{ resourceType: 'PELTS', extractorType: 'HUNTING_LODGE', baseRate: 4 },
			{ resourceType: 'GEMS', extractorType: 'MINE', baseRate: 1 },
			{ resourceType: 'EXOTIC_WOOD', extractorType: 'LUMBER_MILL', baseRate: 2 }
		],
		biomeEfficiencies: [
			{ biomeName: 'Tropical Rainforest', resourceType: 'FOOD', efficiency: 1.5 },
			{ biomeName: 'Tropical Rainforest', resourceType: 'WOOD', efficiency: 2 },
			{ biomeName: 'Tropical Rainforest', resourceType: 'STONE', efficiency: 0.5 }
			// ... Add more as needed
		],
		structureLevels: [
			{ level: 1, multiplier: 1 },
			{ level: 2, multiplier: 1.5 },
			{ level: 3, multiplier: 2.25 },
			{ level: 4, multiplier: 3.375 },
			{ level: 5, multiplier: 5.0625 }
		],
		qualityThresholds: {
			veryPoor: 20,
			poor: 40,
			average: 60,
			good: 80,
			excellent: 100
		},
		resourceDisplay: [
			{ type: 'FOOD', name: 'Food', icon: '🌾' },
			{ type: 'WOOD', name: 'Wood', icon: '🪵' },
			{ type: 'STONE', name: 'Stone', icon: '🪨' },
			{ type: 'ORE', name: 'Ore', icon: '⛏️' },
			{ type: 'CLAY', name: 'Clay', icon: '🧱' },
			{ type: 'HERBS', name: 'Herbs', icon: '🌿' },
			{ type: 'PELTS', name: 'Pelts', icon: '🦊' },
			{ type: 'GEMS', name: 'Gems', icon: '💎' },
			{ type: 'EXOTIC_WOOD', name: 'Exotic Wood', icon: '🌳' }
		],
		extractorDisplay: [
			{ type: 'FARM', name: 'Farm' },
			{ type: 'LUMBER_MILL', name: 'Lumber Mill' },
			{ type: 'QUARRY', name: 'Quarry' },
			{ type: 'MINE', name: 'Mine' },
			{ type: 'FISHING_DOCK', name: 'Fishing Dock' },
			{ type: 'HUNTING_LODGE', name: "Hunter's Lodge" },
			{ type: 'HERB_GARDEN', name: 'Herb Garden' }
		],
		buildingDisplay: [
			{ type: 'HOUSE', name: 'House' },
			{ type: 'STORAGE', name: 'Storage' },
			{ type: 'BARRACKS', name: 'Barracks' },
			{ type: 'WORKSHOP', name: 'Workshop' },
			{ type: 'MARKETPLACE', name: 'Marketplace' },
			{ type: 'TOWN_HALL', name: 'Town Hall' },
			{ type: 'WALL', name: 'Wall' }
		],
		biomeDisplay: {
			GRASSLAND: {
				icon: '🌾',
				color: 'variant-soft-success',
				name: 'Grassland',
				description: ''
			},
			FOREST: { icon: '🌲', color: 'variant-soft-primary', name: 'Forest', description: '' },
			DESERT: { icon: '🏜️', color: 'variant-soft-warning', name: 'Desert', description: '' },
			MOUNTAIN: {
				icon: '⛰️',
				color: 'variant-soft-surface',
				name: 'Mountain',
				description: ''
			},
			TUNDRA: { icon: '🧊', color: 'variant-soft-tertiary', name: 'Tundra', description: '' },
			SWAMP: { icon: '🌿', color: 'variant-soft-secondary', name: 'Swamp', description: '' },
			COASTAL: {
				icon: '🏖️',
				color: 'variant-soft-primary',
				name: 'Coastal',
				description: ''
			},
			OCEAN: { icon: '🌊', color: 'variant-soft-primary', name: 'Ocean', description: '' }
		},
		qualityDisplay: [
			{ threshold: 20, rating: 'Very Poor', color: 'text-red-600', multiplier: 0.5 },
			{ threshold: 40, rating: 'Poor', color: 'text-orange-600', multiplier: 0.75 },
			{ threshold: 60, rating: 'Average', color: 'text-yellow-600', multiplier: 1 },
			{ threshold: 80, rating: 'Good', color: 'text-green-600', multiplier: 1.5 },
			{ threshold: 100, rating: 'Excellent', color: 'text-blue-600', multiplier: 2 }
		],
		accumulation: {
			fullRateHours: 24,
			tier1Multiplier: 0.5,
			tier1Hours: 48,
			tier2Multiplier: 0.25,
			tier2Hours: 96,
			maxHours: 96
		},
		gameLoopTimingConfig: {
			tickRate: 60,
			resourceIntervalSec: 3600,
			populationIntervalSec: 3600,
			socketEmitIntervalSec: 5
		}
	};
}

/**
 * Production Base Rates Interface
 * Simplified interface for just the base production rates
 */
export interface ProductionBaseRates {
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
	clay?: number;
	herbs?: number;
	pelts?: number;
	gems?: number;
	exotic_wood?: number;
}

/**
 * Get production rates from server API
 * Server handles caching (5 minutes), client just fetches
 * Falls back to hardcoded values if fetch fails
 */
export async function getProductionRates(): Promise<ProductionBaseRates> {
	try {
		const response = await fetch(`${PUBLIC_CLIENT_API_URL}/config/production-rates`);
		if (!response.ok) {
			throw new Error(`Failed to fetch production rates: ${response.statusText}`);
		}

		const result = await response.json();
		if (!result.success || !result.data?.baseRates) {
			throw new Error('Invalid production rates response format');
		}

		return result.data.baseRates;
	} catch (error) {
		logger.error('Error fetching production rates, using fallback:', error);
		// Fallback to current hardcoded values (matches current production-calculator.ts)
		return {
			food: 10,
			water: 15,
			wood: 8,
			stone: 6,
			ore: 4,
			clay: 3,
			herbs: 5,
			pelts: 4,
			gems: 1,
			exotic_wood: 2
		};
	}
}
