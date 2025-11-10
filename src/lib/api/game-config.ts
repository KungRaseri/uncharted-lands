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
    resourceDisplay: [
      { type: 'FOOD', name: 'Food', icon: '🌾' },
      { type: 'WOOD', name: 'Wood', icon: '🪵' },
      { type: 'STONE', name: 'Stone', icon: '🪨' },
      { type: 'ORE', name: 'Ore', icon: '⛏️' },
      { type: 'CLAY', name: 'Clay', icon: '🧱' },
      { type: 'HERBS', name: 'Herbs', icon: '🌿' },
      { type: 'PELTS', name: 'Pelts', icon: '🦊' },
      { type: 'GEMS', name: 'Gems', icon: '💎' },
      { type: 'EXOTIC_WOOD', name: 'Exotic Wood', icon: '🌳' },
    ],
    extractorDisplay: [
      { type: 'FARM', name: 'Farm' },
      { type: 'LUMBER_MILL', name: 'Lumber Mill' },
      { type: 'QUARRY', name: 'Quarry' },
      { type: 'MINE', name: 'Mine' },
      { type: 'FISHING_DOCK', name: 'Fishing Dock' },
      { type: 'HUNTERS_LODGE', name: "Hunter's Lodge" },
      { type: 'HERB_GARDEN', name: 'Herb Garden' },
    ],
    buildingDisplay: [
      { type: 'HOUSE', name: 'House' },
      { type: 'STORAGE', name: 'Storage' },
      { type: 'BARRACKS', name: 'Barracks' },
      { type: 'WORKSHOP', name: 'Workshop' },
      { type: 'MARKETPLACE', name: 'Marketplace' },
      { type: 'TOWN_HALL', name: 'Town Hall' },
      { type: 'WALL', name: 'Wall' },
    ],
    qualityDisplay: [
      { threshold: 20, rating: 'Very Poor', color: 'text-red-600', multiplier: 0.5 },
      { threshold: 40, rating: 'Poor', color: 'text-orange-600', multiplier: 0.75 },
      { threshold: 60, rating: 'Average', color: 'text-yellow-600', multiplier: 1 },
      { threshold: 80, rating: 'Good', color: 'text-green-600', multiplier: 1.5 },
      { threshold: 100, rating: 'Excellent', color: 'text-blue-600', multiplier: 2 },
    ],
    accumulation: {
      fullRateHours: 24,
      tier1Multiplier: 0.5,
      tier1Hours: 48,
      tier2Multiplier: 0.25,
      tier2Hours: 96,
      maxHours: 96,
    },
  };
}
