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
 * Uses server config for diminishing returns parameters
 */
export async function calculateAccumulatedResources(
  productionRate: number,
  lastHarvested: Date | null,
): Promise<number> {
  if (!lastHarvested) return 0;

  const config = await ensureConfig();
  const { fullRateHours, tier1Multiplier, tier1Hours, tier2Multiplier, maxHours } =
    config.accumulation;

  const now = new Date();
  const hoursSinceHarvest = (now.getTime() - lastHarvested.getTime()) / (1000 * 60 * 60);

  // Apply diminishing returns based on server config
  let effectiveHours = hoursSinceHarvest;
  if (hoursSinceHarvest > fullRateHours) {
    effectiveHours = fullRateHours + (hoursSinceHarvest - fullRateHours) * tier1Multiplier;
  }
  if (effectiveHours > tier1Hours) {
    effectiveHours = tier1Hours + (hoursSinceHarvest - tier1Hours) * tier2Multiplier;
  }
  if (effectiveHours > maxHours) {
    effectiveHours = maxHours;
  }

  return Math.floor(productionRate * effectiveHours);
}

/**
 * Format time until next harvest (for display)
 * Uses server config for thresholds
 */
export async function formatHarvestTime(
  lastHarvested: Date | null,
  productionRate: number,
): Promise<string> {
  if (!lastHarvested || productionRate === 0) return 'Not producing';

  const config = await ensureConfig();
  const { fullRateHours, maxHours } = config.accumulation;

  const now = new Date();
  const hoursSinceHarvest = (now.getTime() - lastHarvested.getTime()) / (1000 * 60 * 60);

  if (hoursSinceHarvest >= maxHours) return 'Ready (max)';
  if (hoursSinceHarvest >= fullRateHours) return 'Ready';
  if (hoursSinceHarvest >= 1) return `${Math.floor(hoursSinceHarvest)}h ago`;

  const minutesSince = Math.floor(hoursSinceHarvest * 60);
  return `${minutesSince}m ago`;
}

/**
 * Get resource type icon/emoji from server config
 */
export async function getResourceIcon(resourceType: string): Promise<string> {
  const config = await ensureConfig();
  const resource = config.resourceDisplay.find((r) => r.type === resourceType);
  return resource?.icon || '❓';
}

/**
 * Get resource display name from server config
 */
export async function getResourceName(resourceType: string): Promise<string> {
  const config = await ensureConfig();
  const resource = config.resourceDisplay.find((r) => r.type === resourceType);
  return resource?.name || resourceType;
}

/**
 * Get extractor type display name from server config
 */
export async function getExtractorName(extractorType: string): Promise<string> {
  const config = await ensureConfig();
  const extractor = config.extractorDisplay.find((e) => e.type === extractorType);
  return extractor?.name || extractorType;
}

/**
 * Get building type display name from server config
 */
export async function getBuildingName(buildingType: string): Promise<string> {
  const config = await ensureConfig();
  const building = config.buildingDisplay.find((b) => b.type === buildingType);
  return building?.name || buildingType;
}
