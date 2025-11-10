/**
 * Game Configuration Types
 * 
 * IMPORTANT: This file is a copy of server/src/config/game-config.ts types
 * Keep these in sync manually, or better yet, move to a shared package in the future
 */

// ===========================
// ENUMS (Shared between client/server)
// ===========================

export const RESOURCE_TYPES = [
  'FOOD',
  'WOOD',
  'STONE',
  'ORE',
  'CLAY',
  'HERBS',
  'PELTS',
  'GEMS',
  'EXOTIC_WOOD',
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const EXTRACTOR_TYPES = [
  'FARM',
  'LUMBER_MILL',
  'QUARRY',
  'MINE',
  'FISHING_DOCK',
  'HUNTERS_LODGE',
  'HERB_GARDEN',
] as const;

export type ExtractorType = (typeof EXTRACTOR_TYPES)[number];

export const BUILDING_TYPES = [
  'HOUSE',
  'STORAGE',
  'BARRACKS',
  'WORKSHOP',
  'MARKETPLACE',
  'TOWN_HALL',
  'WALL',
] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number];

export const SPECIAL_RESOURCES = [
  'GEMS',
  'EXOTIC_WOOD',
  'MAGICAL_HERBS',
  'ANCIENT_STONE',
] as const;

export type SpecialResource = (typeof SPECIAL_RESOURCES)[number];

// ===========================
// CONFIGURATION TYPES
// ===========================

export interface ResourceDisplayConfig {
  type: ResourceType;
  name: string;
  icon: string;
  description?: string;
}

export interface ExtractorDisplayConfig {
  type: ExtractorType;
  name: string;
  icon?: string;
  description?: string;
}

export interface BuildingDisplayConfig {
  type: BuildingType;
  name: string;
  icon?: string;
  description?: string;
}

export interface QualityDisplayConfig {
  threshold: number;
  rating: string;
  color: string;
  multiplier: number;
}

export interface AccumulationConfig {
  /** Hours before diminishing returns start */
  fullRateHours: number;
  /** Multiplier for next tier (e.g., 0.5 = 50% rate) */
  tier1Multiplier: number;
  /** Hours before second diminishing returns tier */
  tier1Hours: number;
  /** Multiplier for third tier */
  tier2Multiplier: number;
  /** Hours before third diminishing returns tier */
  tier2Hours: number;
  /** Maximum effective hours cap */
  maxHours: number;
}

export interface ProductionRateConfig {
  resourceType: ResourceType;
  extractorType: ExtractorType;
  baseRate: number; // Units per hour at level 1
}

export interface BiomeEfficiencyConfig {
  biomeName: string;
  resourceType: ResourceType;
  efficiency: number; // Multiplier (0-2+)
}

export interface StructureLevelConfig {
  level: number;
  multiplier: number;
  requirements?: {
    food?: number;
    wood?: number;
    stone?: number;
    ore?: number;
  };
}

export interface GameConfig {
  productionRates: ProductionRateConfig[];
  biomeEfficiencies: BiomeEfficiencyConfig[];
  structureLevels: StructureLevelConfig[];
  qualityThresholds: {
    veryPoor: number;
    poor: number;
    average: number;
    good: number;
    excellent: number;
  };
  resourceDisplay: ResourceDisplayConfig[];
  extractorDisplay: ExtractorDisplayConfig[];
  buildingDisplay: BuildingDisplayConfig[];
  qualityDisplay: QualityDisplayConfig[];
  accumulation: AccumulationConfig;
}
