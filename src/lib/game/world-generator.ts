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
    serverId: string | null, worldName: string | null, width: number, height: number, eSeed: number, pSeed: number, tSeed: number
}

export async function generate(mapOptions: MapOptions, elevationOptions: Options, precipitationOptions: Options, temperatureOptions: Options) {
    const elevationMap = generateMap(mapOptions, makeNoise2D(mapOptions.eSeed), elevationOptions);
    const precipitationMap = generateMap(mapOptions, makeNoise2D(mapOptions.pSeed), precipitationOptions);
    const temperatureMap = generateMap(mapOptions, makeNoise2D(mapOptions.tSeed), temperatureOptions);

    return { elevationMap: chunks(elevationMap, 10), precipitationMap: chunks(precipitationMap, 10), temperatureMap: chunks(temperatureMap, 10) }
}

function generateMap(mapOptions: MapOptions, noiseFn: (x: number, y: number) => number, options: Options) {
    const { amplitude, persistence, frequency, octaves, scale } = options;
    const map = makeRectangle(mapOptions.width, mapOptions.height, noiseFn, {
        amplitude,
        persistence,
        frequency,
        octaves,
        scale: scale
    })

    return chunks(map, 10)
}

export async function generateElevation(mapOptions: MapOptions, options: Options) {
    const noiseFn = makeNoise2D(mapOptions.eSeed);
    return generateMap(mapOptions, noiseFn, options);
}

export async function generatePrecipitation(mapOptions: MapOptions, options: Options) {
    const noiseFn = makeNoise2D(mapOptions.pSeed);
    const precipitationMin = 1, precipitationMax = 450;

    return generateMap(mapOptions, noiseFn, { ...options, scale: (x) => normalizeValue(x, precipitationMin, precipitationMax) });
}
export async function generateTemperature(mapOptions: MapOptions, options: Options) {
    const noiseFn = makeNoise2D(mapOptions.tSeed);
    const temperatureMin = -10, temperatureMax = 32;

    return generateMap(mapOptions, noiseFn, { ...options, scale: (x) => normalizeValue(x, temperatureMin, temperatureMax) });
}

function normalizeValue(value: number, min: number, max: number) {
    return value * (max - min) / 2 + (max + min) / 2;
}


