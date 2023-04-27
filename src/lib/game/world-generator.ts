import { makeNoise2D } from 'open-simplex-noise';
import { makeRectangle, type Options } from 'fractal-noise';

function chunks(heightMap: number[][], chunkSize: number) {
    const splitChunks: number[][][] = [];

    if (chunkSize === 0)
        return splitChunks;

    const height = heightMap.length;
    const width = heightMap[0].length;

    for (let i = 0; i < height; i += chunkSize) {
        const rowChunks = []
        for (let j = 0; j < width; j += chunkSize) {
            const chunk = [];

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