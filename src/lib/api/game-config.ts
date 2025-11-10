/**
 * Game Configuration Client
 * 
 * Fetches and caches game configuration from the server API.
 * This ensures client and server use the same game balance values.
 */

import type { GameConfig } from '../types/game-config';

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
      const response = await fetch('/api/config/game');
      if (!response.ok) {
        throw new Error(`Failed to fetch game config: ${response.statusText}`);
      }
      const config = await response.json();
      cachedConfig = config;
      return config;
    } catch (error) {
      console.error('Failed to load game configuration:', error);
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
      { resourceType: 'PELTS', extractorType: 'HUNTERS_LODGE', baseRate: 4 },
      { resourceType: 'GEMS', extractorType: 'MINE', baseRate: 1 },
      { resourceType: 'EXOTIC_WOOD', extractorType: 'LUMBER_MILL', baseRate: 2 },
    ],
    biomeEfficiencies: [
      { biomeName: 'Tropical Rainforest', resourceType: 'FOOD', efficiency: 1.5 },
      { biomeName: 'Tropical Rainforest', resourceType: 'WOOD', efficiency: 2 },
      { biomeName: 'Tropical Rainforest', resourceType: 'STONE', efficiency: 0.5 },
      // ... Add more as needed
    ],
    structureLevels: [
      { level: 1, multiplier: 1 },
      { level: 2, multiplier: 1.5 },
      { level: 3, multiplier: 2.25 },
      { level: 4, multiplier: 3.375 },
      { level: 5, multiplier: 5.0625 },
    ],
    qualityThresholds: {
      veryPoor: 20,
      poor: 40,
      average: 60,
      good: 80,
      excellent: 100,
    },
  };
}
