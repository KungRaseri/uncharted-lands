/**
 * Client-side resource production utilities
 * Mirrors server-side calculations for UI display
 * 
 * Uses game configuration from server API to ensure consistency
 */

import { getGameConfig } from '../api/game-config';
import type { GameConfig } from '../types/game-config';

let configCache: GameConfig | null = null;

/**
 * Ensure config is loaded
 */
async function ensureConfig(): Promise<GameConfig> {
  configCache ??= await getGameConfig();
  return configCache;
}

/**
 * DEPRECATED: Use getBaseProductionRate() instead
 * Kept for backward compatibility
 */
export const BASE_PRODUCTION_RATES = {
  FOOD: { FARM: 10 },
  WOOD: { LUMBER_MILL: 8 },
  STONE: { QUARRY: 6 },
  ORE: { MINE: 4 },
  CLAY: { QUARRY: 3 },
  HERBS: { HERB_GARDEN: 5 },
  PELTS: { HUNTERS_LODGE: 4 },
  GEMS: { MINE: 1 },
  EXOTIC_WOOD: { LUMBER_MILL: 2 },
} as const;

/**
 * Get base production rate from config
 */
export async function getBaseProductionRate(
  resourceType: string,
  extractorType: string,
): Promise<number> {
  const config = await ensureConfig();
  const rateConfig = config.productionRates.find(
    (r) => r.resourceType === resourceType && r.extractorType === extractorType,
  );
  return rateConfig?.baseRate ?? 0;
}

/**
 * Get biome efficiency from config
 */
export async function getBiomeEfficiency(
  biomeName: string,
  resourceType: string,
): Promise<number> {
  const config = await ensureConfig();
  const efficiencyConfig = config.biomeEfficiencies.find(
    (e) => e.biomeName === biomeName && e.resourceType === resourceType,
  );
  return efficiencyConfig?.efficiency ?? 1;
}

// Structure level multipliers
export async function getStructureLevelMultiplier(level: number): Promise<number> {
  const config = await ensureConfig();
  const levelConfig = config.structureLevels.find((l) => l.level === level);
  return levelConfig?.multiplier ?? Math.pow(1.5, level - 1);
}

/**
 * Calculate production rate using server config
 */
export async function calculateProductionRate(params: {
  resourceType: string;
  extractorType: string;
  biomeName: string;
  structureLevel: number;
}): Promise<number> {
  const { resourceType, extractorType, biomeName, structureLevel } = params;

  const baseRate = await getBaseProductionRate(resourceType, extractorType);
  if (baseRate === 0) return 0;

  const biomeEfficiency = await getBiomeEfficiency(biomeName, resourceType);
  const levelMultiplier = await getStructureLevelMultiplier(structureLevel);

  const productionRate = baseRate * biomeEfficiency * levelMultiplier;
  return Math.round(productionRate * 100) / 100;
}

/**
 * Get quality rating label and color
 */
export async function getQualityInfo(quality: number): Promise<{
  rating: string;
  color: string;
  multiplier: number;
}> {
  const config = await ensureConfig();
  const t = config.qualityThresholds;

  if (quality <= t.veryPoor)
    return { rating: 'Very Poor', color: 'text-red-600', multiplier: 0.5 };
  if (quality <= t.poor)
    return { rating: 'Poor', color: 'text-orange-600', multiplier: 0.75 };
  if (quality <= t.average)
    return { rating: 'Average', color: 'text-yellow-600', multiplier: 1 };
  if (quality <= t.good)
    return { rating: 'Good', color: 'text-green-600', multiplier: 1.5 };
  return { rating: 'Excellent', color: 'text-blue-600', multiplier: 2 };
}

/**
 * Calculate accumulated resources since last harvest
 */
export function calculateAccumulatedResources(
  productionRate: number,
  lastHarvested: Date | null
): number {
  if (!lastHarvested) return 0;

  const now = new Date();
  const hoursSinceHarvest = (now.getTime() - lastHarvested.getTime()) / (1000 * 60 * 60);

  // Apply diminishing returns after 24 hours
  let effectiveHours = hoursSinceHarvest;
  if (hoursSinceHarvest > 24) {
    effectiveHours = 24 + (hoursSinceHarvest - 24) * 0.5;
  }
  if (effectiveHours > 48) {
    effectiveHours = 48 + (hoursSinceHarvest - 48) * 0.25;
  }
  if (effectiveHours > 96) {
    effectiveHours = 96;
  }

  return Math.floor(productionRate * effectiveHours);
}

/**
 * Format time until next harvest (for display)
 */
export function formatHarvestTime(lastHarvested: Date | null, productionRate: number): string {
  if (!lastHarvested || productionRate === 0) return 'Not producing';

  const now = new Date();
  const hoursSinceHarvest = (now.getTime() - lastHarvested.getTime()) / (1000 * 60 * 60);

  if (hoursSinceHarvest >= 96) return 'Ready (max)';
  if (hoursSinceHarvest >= 24) return 'Ready';
  if (hoursSinceHarvest >= 1) return `${Math.floor(hoursSinceHarvest)}h ago`;

  const minutesSince = Math.floor(hoursSinceHarvest * 60);
  return `${minutesSince}m ago`;
}

/**
 * Get resource type icon/emoji
 */
export function getResourceIcon(resourceType: string): string {
  const icons: Record<string, string> = {
    FOOD: '🌾',
    WOOD: '🪵',
    STONE: '🪨',
    ORE: '⛏️',
    CLAY: '🧱',
    HERBS: '🌿',
    PELTS: '🦊',
    GEMS: '💎',
    EXOTIC_WOOD: '🌳',
  };
  return icons[resourceType] || '❓';
}

/**
 * Get extractor type display name
 */
export function getExtractorName(extractorType: string): string {
  const names: Record<string, string> = {
    FARM: 'Farm',
    LUMBER_MILL: 'Lumber Mill',
    QUARRY: 'Quarry',
    MINE: 'Mine',
    FISHING_DOCK: 'Fishing Dock',
    HUNTERS_LODGE: "Hunter's Lodge",
    HERB_GARDEN: 'Herb Garden',
  };
  return names[extractorType] || extractorType;
}

/**
 * Get building type display name
 */
export function getBuildingName(buildingType: string): string {
  const names: Record<string, string> = {
    HOUSE: 'House',
    STORAGE: 'Storage',
    BARRACKS: 'Barracks',
    WORKSHOP: 'Workshop',
    MARKETPLACE: 'Marketplace',
    TOWN_HALL: 'Town Hall',
    WALL: 'Wall',
  };
  return names[buildingType] || buildingType;
}
