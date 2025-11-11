/**
 * World Generator (Client-Side)
 * 
 * ⚠️ DEPRECATED for gameplay use
 * 
 * This file is ONLY used by admin tools:
 * - /admin/worlds/create - Custom world generation form
 * 
 * 🎮 For Gameplay:
 * Use server-side world generation via Socket.IO:
 * ```typescript
 * import { gameSocket } from '$lib/stores/game/socket';
 * await gameSocket.createWorld({ worldName, seed, width, height });
 * ```
 * 
 * 🔒 Server Authority:
 * All gameplay world creation goes through:
 * - server/src/game/world-generator.ts
 * - server/src/game/world-creator.ts
 * - server/src/events/handlers.ts (create-world handler)
 * 
 * 🚀 Future: Migrate admin tool to server or remove this file.
 */

import { makeNoise2D } from 'open-simplex-noise';
import { makeRectangle, type Options } from 'fractal-noise';

export function chunks(heightMap: number[][], chunkSize: number): number[][][][] {
    const splitChunks: number[][][][] = [];

    if (chunkSize === 0)
        return splitChunks;

    const height = heightMap.length;
    const width = heightMap[0].length;

    for (let i = 0; i < height; i += chunkSize) {
        const rowChunks: number[][][] = []
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

type MapOptions = {
    serverId: string | null, worldName: string | null, width: number, height: number, seed: number
}

export async function generateMap(mapOptions: MapOptions, options: Options) {
    const { amplitude, persistence, frequency, octaves, scale } = options;

    const noiseFn = makeNoise2D(mapOptions.seed);

    const map = makeRectangle(mapOptions.width, mapOptions.height, noiseFn, {
        amplitude,
        persistence,
        frequency,
        octaves,
        scale: scale
    })

    return chunks(map, 10)
}

export function normalizeValue(value: number, min: number, max: number) {
    return value * (max - min) / 2 + (max + min) / 2;
}