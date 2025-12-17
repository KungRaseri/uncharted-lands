/**
 * World Creation Service
 *
 * Handles complete world generation from noise maps to database persistence
 */

import { logger } from '../utils/logger.js';
import {
	generateWorldLayers,
	normalizeValue,
	type MapOptions,
	type NoiseOptions,
} from './world-generator.js';
import {
	calculateResourceQuality,
	calculatePlotSlots,
	determineSpecialResource,
} from '../utils/resource-quality.js';
import { db, worlds, regions, tiles } from '../db/index.js';
import { getAllBiomes, findBiome } from '../db/queries.js';
import { createId } from '@paralleldrive/cuid2';

export interface WorldCreationOptions {
	serverId: string | null;
	worldName: string;
	worldId?: string; // Optional: if provided, use this ID instead of generating a new one
	width: number;
	height: number;
	seed: number;
	elevationOptions: NoiseOptions;
	precipitationOptions: NoiseOptions;
	temperatureOptions: NoiseOptions;
}

export interface WorldCreationResult {
	worldId: string;
	regionCount: number;
	tileCount: number;
	duration: number;
}

/**
 * Create a complete world with all regions, tiles, and plots
 */
export async function createWorld(options: WorldCreationOptions): Promise<WorldCreationResult> {
	const startTime = Date.now();

	logger.info('[WORLD CREATE] Starting world creation', {
		worldName: options.worldName,
		dimensions: `${options.width}x${options.height}`,
		seed: options.seed,
	});

	// Step 1: Generate world layers (elevation, precipitation, temperature)
	const mapOptions: MapOptions = {
		serverId: options.serverId,
		worldName: options.worldName,
		width: options.width,
		height: options.height,
		seed: options.seed,
	};

	const regionData = await generateWorldLayers(
		mapOptions,
		options.elevationOptions,
		options.precipitationOptions,
		options.temperatureOptions
	);

	// Step 2: Load biomes from database
	const biomes = await getAllBiomes();

	if (biomes.length === 0) {
		throw new Error('No biomes found in database. Please seed the database first.');
	}

	logger.info('[WORLD CREATE] Loaded biomes', { biomeCount: biomes.length });

	// Step 3: Create or use existing world record
	const worldId = options.worldId || createId();
	const worldRecord = {
		id: worldId,
		name: options.worldName,
		serverId: options.serverId ?? '', // Handle nullable serverId with empty string default
		elevationSettings: options.elevationOptions,
		precipitationSettings: options.precipitationOptions,
		temperatureSettings: options.temperatureOptions,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	// Step 4: Create regions
	const regionRecords = regionData.map((region) => ({
		id: createId(),
		worldId: worldId,
		name: `Region ${region.xCoord},${region.yCoord}`, // Add required name field
		xCoord: region.xCoord,
		yCoord: region.yCoord,
		elevationMap: region.elevationMap,
		precipitationMap: region.precipitationMap,
		temperatureMap: region.temperatureMap,
	}));

	logger.info('[WORLD CREATE] Generated regions', { regionCount: regionRecords.length });

	// Step 5: Create tiles
	const tileRecords: Array<{
		id: string;
		regionId: string;
		biomeId: string;
		type: 'OCEAN' | 'LAND';
		elevation: number;
		precipitation: number;
		temperature: number;
		xCoord: number;
		yCoord: number;
		foodQuality: number;
		waterQuality: number;
		woodQuality: number;
		stoneQuality: number;
		oreQuality: number;
		plotSlots: number;
		specialResource?: 'GEMS' | 'EXOTIC_WOOD' | 'MAGICAL_HERBS' | 'ANCIENT_STONE' | null;
	}> = [];

	for (const region of regionRecords) {
		const elevationMap = region.elevationMap;
		const precipitationMap = region.precipitationMap;
		const temperatureMap = region.temperatureMap;

		for (const [x, row] of elevationMap.entries()) {
			for (const [y, elevation] of row.entries()) {
				const type = elevation < 0 ? 'OCEAN' : 'LAND';
				const normalizedPrecip = normalizeValue(precipitationMap[x][y], 0, 450);
				const normalizedTemp = normalizeValue(temperatureMap[x][y], -10, 32);

				const biome = await findBiome(normalizedPrecip, normalizedTemp);

				if (!biome?.id) {
					throw new Error(
						`Failed to determine biome for tile at region ${region.xCoord}:${region.yCoord}, tile ${x}:${y}`
					);
				}

				// Calculate resource quality based on biome
				const tileSeed = options.seed + x * 1000 + y;
				const resourceQuality = calculateResourceQuality(biome, tileSeed);
				const plotSlots = calculatePlotSlots(biome);
				const specialResource = determineSpecialResource(biome, (tileSeed % 100) / 100);

				tileRecords.push({
					id: createId(),
					regionId: region.id,
					biomeId: biome.id,
					type,
					elevation: elevationMap[x][y],
					precipitation: precipitationMap[x][y],
					temperature: temperatureMap[x][y],
					xCoord: x,
					yCoord: y,
					foodQuality: resourceQuality.foodQuality,
					waterQuality: resourceQuality.waterQuality,
					woodQuality: resourceQuality.woodQuality,
					stoneQuality: resourceQuality.stoneQuality,
					oreQuality: resourceQuality.oreQuality,
					plotSlots,
					specialResource,
				});
			}
		}
	}

	logger.info('[WORLD CREATE] Generated tiles', { tileCount: tileRecords.length });

	// Step 6: Save everything to database in a transaction
	logger.info('[WORLD CREATE] Saving to database...');

	await db.transaction(async (tx) => {
		// Insert world (only if worldId was not provided - meaning it's a new world)
		if (!options.worldId) {
			await tx.insert(worlds).values(worldRecord);
		}

		// Insert regions in batches
		const regionBatchSize = 100;
		for (let i = 0; i < regionRecords.length; i += regionBatchSize) {
			const batch = regionRecords.slice(i, i + regionBatchSize);
			await tx.insert(regions).values(batch);
		}

		// Insert tiles in batches
		const tileBatchSize = 500;
		for (let i = 0; i < tileRecords.length; i += tileBatchSize) {
			const batch = tileRecords.slice(i, i + tileBatchSize);
			await tx.insert(tiles).values(batch);
		}
	});

	const duration = Date.now() - startTime;

	logger.info('[WORLD CREATE] World creation complete', {
		worldId,
		regionCount: regionRecords.length,
		tileCount: tileRecords.length,
		durationMs: duration,
		durationFormatted: `${(duration / 1000).toFixed(2)}s`,
	});

	return {
		worldId,
		regionCount: regionRecords.length,
		tileCount: tileRecords.length,
		duration,
	};
}
