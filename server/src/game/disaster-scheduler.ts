/**
 * Disaster Scheduler
 *
 * Implements probability-based disaster triggering system from GDD Section 5.4
 *
 * Design:
 * - Checks hourly for potential disasters (every 216,000 ticks at 60Hz)
 * - Probability varies by world template (Rare/Normal/Frequent)
 * - Biome-specific disaster types (e.g., coastal → tsunami, desert → drought)
 * - Regional disasters affect specific areas, world-scale affect entire world
 *
 * Disaster Frequency Rates (per region per hour):
 * - RARE mode: 0.5% (0.005) - 1 disaster every 7-14 days per region
 * - NORMAL mode: 1.5% (0.015) - 1 disaster every 3-7 days per region
 * - FREQUENT mode: 4.0% (0.04) - 1 disaster every 1-3 days per region
 *
 * @module game/disaster-scheduler
 */

import { db } from '../db/index.js';
import {
	disasterEvents,
	worlds,
	tiles,
	regions,
	BIOME_DISASTER_MAP,
	type BiomeType,
	type DisasterType,
	type DisasterSeverity,
} from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

/**
 * World template disaster frequency settings
 */
export interface WorldDisasterConfig {
	frequency: 'RARE' | 'NORMAL' | 'FREQUENT';
	probabilityPerHour: number; // Per region per hour
	severityMultiplier: number; // Applied to base severity (0.5x to 2.0x)
	warningTimeMultiplier: number; // Applied to base warning time
}

/**
 * Get disaster configuration for a world template
 */
export function getWorldDisasterConfig(templateType: string): WorldDisasterConfig {
	switch (templateType) {
		case 'SURVIVAL':
		case 'HARDCORE':
			return {
				frequency: 'FREQUENT',
				probabilityPerHour: 0.04, // 4% per hour
				severityMultiplier: 1.2,
				warningTimeMultiplier: 0.75, // 25% less warning time
			};
		case 'RELAXED':
		case 'CASUAL':
			return {
				frequency: 'RARE',
				probabilityPerHour: 0.005, // 0.5% per hour
				severityMultiplier: 0.7,
				warningTimeMultiplier: 1.5, // 50% more warning time
			};
		case 'APOCALYPSE':
		case 'EXTREME':
			return {
				frequency: 'FREQUENT',
				probabilityPerHour: 0.08, // 8% per hour (constant disasters)
				severityMultiplier: 1.5,
				warningTimeMultiplier: 0.5, // 50% less warning time
			};
		case 'STANDARD':
		case 'NORMAL':
		default:
			return {
				frequency: 'NORMAL',
				probabilityPerHour: 0.015, // 1.5% per hour
				severityMultiplier: 1,
				warningTimeMultiplier: 1,
			};
	}
}

/**
 * Calculate base disaster severity (0-100)
 * Formula: 20 + random(0-60) × template multiplier × biome vulnerability
 */
export function calculateDisasterSeverity(
	templateMultiplier: number,
	biomeVulnerability: number = 1
): number {
	const baseSeverity = 20 + Math.random() * 60; // 20-80 range
	const adjustedSeverity = baseSeverity * templateMultiplier * biomeVulnerability;
	return Math.min(100, Math.max(0, Math.round(adjustedSeverity)));
}

/**
 * Convert numeric severity (0-100) to severity level enum
 * Maps to DisasterSeverityEnum from schema
 */
export function getSeverityLevel(severity: number): DisasterSeverity {
	if (severity < 25) return 'MILD';
	if (severity < 50) return 'MODERATE';
	if (severity < 75) return 'MAJOR';
	return 'CATASTROPHIC';
}

/**
 * Select disaster type based on biome and risk levels
 */
export function selectDisasterType(biomeType: BiomeType): DisasterType {
	const biomeData = BIOME_DISASTER_MAP[biomeType];

	// Weighted random selection:
	// High risk: 60% chance
	// Moderate risk: 30% chance
	// Low risk: 10% chance
	const random = Math.random();

	let disasters: readonly string[];
	if (random < 0.6 && biomeData.highRisk.length > 0) {
		disasters = biomeData.highRisk;
	} else if (random < 0.9 && biomeData.moderateRisk.length > 0) {
		disasters = biomeData.moderateRisk;
	} else if (biomeData.lowRisk.length > 0) {
		disasters = biomeData.lowRisk;
	} else {
		// Fallback to high risk if no disasters in selected category
		disasters = biomeData.highRisk.length > 0 ? biomeData.highRisk : biomeData.moderateRisk;
	}

	// Random selection from chosen risk level
	const selectedIndex = Math.floor(Math.random() * disasters.length);
	return disasters[selectedIndex] as DisasterType;
}

/**
 * Get biome types that are vulnerable to a specific disaster type
 * Returns array of biome names that have this disaster in high/moderate/low risk
 */
export function getVulnerableBiomes(disasterType: DisasterType): string[] {
	const vulnerableBiomes: string[] = [];

	for (const [biome, risks] of Object.entries(BIOME_DISASTER_MAP)) {
		const allDisasters = [...risks.highRisk, ...risks.moderateRisk, ...risks.lowRisk];
		if (allDisasters.includes(disasterType)) {
			vulnerableBiomes.push(biome);
		}
	}

	return vulnerableBiomes;
}

/**
 * Calculate warning time for disaster (in seconds)
 * Base warning times by disaster category + world template modifier
 */
export function calculateWarningTime(
	disasterType: DisasterType,
	templateMultiplier: number
): number {
	// Base warning times (in seconds) - from GDD
	const baseWarningTimes: Record<string, number> = {
		// Natural (2-4 hours base)
		EARTHQUAKE: 3600, // 1 hour (animals fleeing, etc.)
		FLOOD: 7200, // 2 hours
		DROUGHT: 86400, // 24 hours (slow onset)
		WILDFIRE: 5400, // 1.5 hours (visible smoke)
		TSUNAMI: 1800, // 30 minutes (after earthquake)

		// Weather (2-6 hours base)
		HURRICANE: 14400, // 4 hours
		TORNADO: 1800, // 30 minutes (sudden)
		BLIZZARD: 10800, // 3 hours
		HEATWAVE: 43200, // 12 hours (gradual)
		EXTREME_COLD: 43200, // 12 hours
		SANDSTORM: 5400, // 1.5 hours
		STORM_SURGE: 7200, // 2 hours

		// Biological (1-7 days base)
		PLAGUE: 604800, // 7 days (gradual spread)
		LOCUST_SWARM: 172800, // 2 days (scouts spotted)
		INSECT_SWARM: 86400, // 1 day
		INSECT_PLAGUE: 259200, // 3 days
		BLIGHT: 432000, // 5 days (crop deterioration)

		// Geological (30 min - 2 hours base)
		VOLCANIC_ERUPTION: 7200, // 2 hours (seismic activity)
		LANDSLIDE: 3600, // 1 hour (tremors, cracks)
		AVALANCHE: 1800, // 30 minutes (snow instability)
		SINKHOLE: 5400, // 1.5 hours (ground subsidence)

		// Catastrophic (7 days for world events)
		MEGAQUAKE: 604800, // 7 days
		SUPERSTORM: 604800, // 7 days
		APOCALYPSE_EVENT: 604800, // 7 days
	};

	const baseTime = baseWarningTimes[disasterType] || 7200; // Default 2 hours
	return Math.round(baseTime * templateMultiplier);
}

/**
 * Calculate disaster impact duration (in seconds)
 * How long the disaster actively affects settlements
 */
export function calculateImpactDuration(disasterType: DisasterType): number {
	const durations: Record<string, number> = {
		// Quick events (5-15 minutes)
		EARTHQUAKE: 600, // 10 minutes
		TORNADO: 300, // 5 minutes
		AVALANCHE: 600, // 10 minutes
		TSUNAMI: 900, // 15 minutes

		// Medium events (30 min - 2 hours)
		FLOOD: 3600, // 1 hour
		WILDFIRE: 7200, // 2 hours
		HURRICANE: 5400, // 1.5 hours
		BLIZZARD: 10800, // 3 hours
		SANDSTORM: 3600, // 1 hour
		STORM_SURGE: 3600, // 1 hour
		LANDSLIDE: 1800, // 30 minutes
		SINKHOLE: 1800, // 30 minutes
		VOLCANIC_ERUPTION: 7200, // 2 hours

		// Long events (6-24 hours)
		DROUGHT: 86400, // 24 hours (continuous stress)
		HEATWAVE: 43200, // 12 hours
		EXTREME_COLD: 43200, // 12 hours
		PLAGUE: 604800, // 7 days (ongoing casualties)
		LOCUST_SWARM: 21600, // 6 hours
		INSECT_SWARM: 14400, // 4 hours
		INSECT_PLAGUE: 43200, // 12 hours
		BLIGHT: 172800, // 2 days

		// Catastrophic (12-24 hours)
		MEGAQUAKE: 28800, // 8 hours
		SUPERSTORM: 43200, // 12 hours
		APOCALYPSE_EVENT: 86400, // 24 hours
	};

	return durations[disasterType] || 3600; // Default 1 hour
}

/**
 * Check if a disaster should be triggered this hour
 * Called every 216,000 ticks (1 hour at 60Hz)
 */
export async function checkRegionalDisasterTrigger(
	worldId: string,
	currentTime: number
): Promise<void> {
	try {
		// Get world configuration
		const world = await db.query.worlds.findFirst({
			where: eq(worlds.id, worldId),
		});

		if (!world) {
			logger.warn(`[DISASTER SCHEDULER] World ${worldId} not found`);
			return;
		}

		const config = getWorldDisasterConfig(world.worldTemplateType || 'STANDARD'); // Probability check - should we trigger a disaster this hour?
		const random = Math.random();
		if (random > config.probabilityPerHour) {
			// No disaster this hour
			logger.debug(
				`[DISASTER SCHEDULER] No disaster triggered for world ${worldId} ` +
					`(rolled ${random.toFixed(4)} > ${config.probabilityPerHour})`
			);
			return;
		}

		logger.info(
			`[DISASTER SCHEDULER] Disaster triggered for world ${worldId} ` +
				`(rolled ${random.toFixed(4)} <= ${config.probabilityPerHour})`
		);

		// Get a random region from the world
		const worldRegions = await db.query.regions.findMany({
			where: eq(regions.worldId, worldId),
		});

		if (worldRegions.length === 0) {
			logger.warn(`[DISASTER SCHEDULER] No regions found for world ${worldId}`);
			return;
		}

		// Select random region
		const targetRegion = worldRegions[Math.floor(Math.random() * worldRegions.length)];

		// Get tiles in the region to determine dominant biome
		const regionTiles = await db.query.tiles.findMany({
			where: eq(tiles.regionId, targetRegion.id),
			limit: 50, // Sample to determine biome distribution
		});

		if (regionTiles.length === 0) {
			logger.warn(`[DISASTER SCHEDULER] No tiles found in region ${targetRegion.id}`);
			return;
		}

		// Select disaster type based on dominant biome in region
		const randomTile = regionTiles[Math.floor(Math.random() * regionTiles.length)];
		const dominantBiome = randomTile.biome as BiomeType;
		const disasterType = selectDisasterType(dominantBiome);

		// Get all biomes vulnerable to this disaster type
		const vulnerableBiomes = getVulnerableBiomes(disasterType);

		// Calculate severity
		const biomeVulnerability = 1; // Could vary by specific disaster/biome combo
		const severity = calculateDisasterSeverity(config.severityMultiplier, biomeVulnerability);

		// Calculate timing
		const warningTime = calculateWarningTime(disasterType, config.warningTimeMultiplier);
		const impactDuration = calculateImpactDuration(disasterType);
		const scheduledAt = currentTime + warningTime * 1000; // Convert to ms

		// Create disaster event
		await db.insert(disasterEvents).values({
			worldId: worldId,
			type: disasterType,
			severity: severity,
			severityLevel: getSeverityLevel(severity),
			affectedRegionIds: [targetRegion.id], // Single region for random events
			affectedBiomes: vulnerableBiomes, // All biome types vulnerable to this disaster
			status: 'SCHEDULED',
			scheduledAt: new Date(scheduledAt),
			warningIssuedAt: null, // Set when warning is issued
			warningTime: warningTime,
			impactDuration: impactDuration,
		});

		logger.info(
			`[DISASTER SCHEDULER] Created disaster event:\n` +
				`  Type: ${disasterType}\n` +
				`  Severity: ${severity} (${getSeverityLevel(severity)})\n` +
				`  Region: ${targetRegion.name} (${targetRegion.id})\n` +
				`  Dominant Biome: ${dominantBiome}\n` +
				`  Vulnerable Biomes: ${vulnerableBiomes.join(', ')}\n` +
				`  Warning Time: ${warningTime}s (${(warningTime / 3600).toFixed(1)}h)\n` +
				`  Impact Duration: ${impactDuration}s (${(impactDuration / 60).toFixed(0)}min)\n` +
				`  Scheduled At: ${new Date(scheduledAt).toISOString()}`
		);
	} catch (error) {
		logger.error('[DISASTER SCHEDULER] Error checking disaster trigger', {
			worldId,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		});
	}
}

/**
 * Process all active worlds for hourly disaster checks
 * Called from game loop every 216,000 ticks (1 hour at 60Hz)
 */
export async function processHourlyDisasterChecks(currentTime: number): Promise<void> {
	try {
		// Get all active worlds
		const activeWorlds = await db.query.worlds.findMany({
			where: eq(worlds.status, 'READY'),
		});

		logger.info(
			`[DISASTER SCHEDULER] Processing hourly disaster checks for ${activeWorlds.length} worlds`
		);

		// Check each world independently
		for (const world of activeWorlds) {
			await checkRegionalDisasterTrigger(world.id, currentTime);
		}
	} catch (error) {
		logger.error('[DISASTER SCHEDULER] Error processing hourly checks', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		});
	}
}
