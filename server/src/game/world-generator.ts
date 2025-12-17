/**
 * World Generation System
 *
 * Generates complete game worlds with:
 * - Procedural terrain using Perlin/Simplex noise
 * - Multiple environmental layers (elevation, precipitation, temperature)
 * - Biome determination based on environmental factors
 * - Plot generation with resource values
 */

import { makeNoise2D } from 'open-simplex-noise';
import { makeRectangle } from 'fractal-noise';
import { logger } from '../utils/logger.js';

/**
 * Split a 2D heightmap into chunks
 */
function chunks(heightMap: number[][], chunkSize: number): number[][][][] {
	const splitChunks: number[][][][] = [];

	if (chunkSize === 0) return splitChunks;

	const height = heightMap.length;
	const width = heightMap[0].length;

	for (let i = 0; i < height; i += chunkSize) {
		const rowChunks: number[][][] = [];
		for (let j = 0; j < width; j += chunkSize) {
			const chunk: number[][] = [];

			for (let y = i; y < i + chunkSize; y++) {
				if (y >= height) break;
				const row = heightMap[y];
				const slicedRow = row.slice(j, j + chunkSize);
				chunk.push(slicedRow);
			}
			rowChunks.push(chunk);
		}
		splitChunks.push(rowChunks);
	}

	return splitChunks;
}

/**
 * Normalize a value from [-1, 1] to [min, max]
 */
export function normalizeValue(value: number, min: number, max: number): number {
	return (value * (max - min)) / 2 + (max + min) / 2;
}

export interface MapOptions {
	serverId: string | null;
	worldName: string;
	width: number;
	height: number;
	seed: number;
}

export interface NoiseOptions {
	amplitude: number;
	persistence: number;
	frequency: number;
	octaves: number;
	scale: (x: number) => number;
}

/**
 * Generate a heightmap using fractal noise
 */
export async function generateMap(
	mapOptions: MapOptions,
	options: NoiseOptions
): Promise<number[][][][]> {
	const { amplitude, persistence, frequency, octaves, scale } = options;

	logger.info('[WORLD GEN] Generating heightmap', {
		width: mapOptions.width,
		height: mapOptions.height,
		seed: mapOptions.seed,
		octaves,
	});

	const noiseFn = makeNoise2D(mapOptions.seed);

	const map = makeRectangle(mapOptions.width, mapOptions.height, noiseFn, {
		amplitude,
		persistence,
		frequency,
		octaves,
		scale: scale,
	});

	return chunks(map, 10);
}

export interface RegionData {
	xCoord: number;
	yCoord: number;
	elevationMap: number[][];
	precipitationMap: number[][];
	temperatureMap: number[][];
}

/**
 * Generate all environmental layers for a world
 */
export async function generateWorldLayers(
	mapOptions: MapOptions,
	elevationOptions: NoiseOptions,
	precipitationOptions: NoiseOptions,
	temperatureOptions: NoiseOptions
): Promise<RegionData[]> {
	logger.info('[WORLD GEN] Generating world layers', {
		worldName: mapOptions.worldName,
		dimensions: `${mapOptions.width}x${mapOptions.height}`,
	});

	// Generate all three environmental layers
	const elevationChunks = await generateMap(mapOptions, elevationOptions);
	const precipitationChunks = await generateMap(
		{ ...mapOptions, seed: mapOptions.seed + 1 },
		precipitationOptions
	);
	const temperatureChunks = await generateMap(
		{ ...mapOptions, seed: mapOptions.seed + 2 },
		temperatureOptions
	);

	// Combine chunks into regions
	const regions: RegionData[] = [];

	// Iterate y (row) then x (column) to match preview display order
	// xCoord represents the row, yCoord represents the column
	for (let y = 0; y < elevationChunks.length; y++) {
		for (let x = 0; x < elevationChunks[y].length; x++) {
			regions.push({
				xCoord: y, // y index becomes xCoord (row)
				yCoord: x, // x index becomes yCoord (column)
				elevationMap: elevationChunks[y][x],
				precipitationMap: precipitationChunks[y][x],
				temperatureMap: temperatureChunks[y][x],
			});
		}
	}

	logger.info('[WORLD GEN] Generated regions', {
		regionCount: regions.length,
	});

	return regions;
}
