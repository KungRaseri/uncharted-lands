// import { createNoise2D, type NoiseFunction2D } from 'simplex-noise';
import { makeNoise2D } from 'open-simplex-noise';
import type { Noise2D } from 'open-simplex-noise/lib/2d';

import alea from 'alea';

// function determineBiome(elevation: number, moisture: number) {
//     if (elevation < 0.0025)
//         return Biome.WATER;

//     if (elevation < 0.0075)
//         return Biome.BEACH

//     if (elevation > 0.6) {
//         if (moisture < 0.1) {
//             //scorched
//         }
//         if (moisture < 0.2) {
//             //bare
//         }
//         if (moisture < 0.5) {
//             //taiga
//         }
//         return Biome.SNOW
//     }


//     if (elevation > 0.3) {
//         if (moisture < 0.33) return Biome.DESERT
//         if (moisture < 0.66) return Biome.SAVANNAH

//         return Biome.PLAINS
//     }

//     if (moisture < 0.16) return Biome.DESERT
//     if (moisture < 0.33) return Biome.PLAINS
//     if (moisture < 0.66) return Biome.FOREST

//     return Biome.JUNGLE
// }

// function determineTileResources(tile: Tile) {
//     const resources: TileResource[] = [];

//     switch (tile.biome) {
//         case Biome.WATER:
//             resources.push({
//                 resource: Resource.FOOD,
//                 value: 2,
//                 id: crypto.randomUUID(),
//                 tileId: tile.id
//             })
//             resources.push({
//                 resource: Resource.WATER,
//                 value: 5,
//                 id: crypto.randomUUID(),
//                 tileId: tile.id
//             })
//             break;
//         case Biome.BEACH:
//             resources.push({
//                 resource: Resource.FOOD,
//                 value: 2,
//                 id: crypto.randomUUID(),
//                 tileId: tile.id
//             })
//             resources.push({
//                 resource: Resource.WATER,
//                 value: 1,
//                 id: crypto.randomUUID(),
//                 tileId: tile.id
//             })
//             break;
//         case Biome.PLAINS:
//             resources.push({
//                 resource: Resource.FOOD,
//                 value: 3,
//                 id: crypto.randomUUID(),
//                 tileId: tile.id
//             })
//             resources.push({
//                 resource: Resource.WATER,
//                 value: 2,
//                 id: crypto.randomUUID(),
//                 tileId: tile.id
//             })
//             break;
//         case Biome.DESERT:
//             resources.push({
//                 resource: Resource.FOOD,
//                 value: 3,
//                 id: crypto.randomUUID(),
//                 tileId: tile.id
//             })
//             resources.push({
//                 resource: Resource.WATER,
//                 value: 2,
//                 id: crypto.randomUUID(),
//                 tileId: tile.id
//             })
//             break;
//         case Biome.SNOW:
//             resources.push({
//                 resource: Resource.FOOD,
//                 value: 1,
//                 id: crypto.randomUUID(),
//                 tileId: tile.id
//             })
//             resources.push({
//                 resource: Resource.WATER,
//                 value: 2,
//                 id: crypto.randomUUID(),
//                 tileId: tile.id
//             })
//             break;
//     }

//     return resources;
// }

function chunks(array: number[], chunkSize: number) {
    if (chunkSize === 0)
        return;

    const splitChunks: number[][] = [];

    for (let i = 0; i < array.length; i += chunkSize) {
        const chunk = array.slice(i, i + chunkSize);
        splitChunks.push(chunk)
    }

    return splitChunks;
}

function sumOctave(noiseFunc: Noise2D, iterations: number, x: number, y: number, persistence: number, scale: number, low: number, high: number, mask: number) {
    let maxAmp = 0;
    let amp = 1;
    let freq = scale;
    let noise = 0

    for (let i = 0; i < iterations; i++) {
        noise += amp * noiseFunc(x * freq, y * freq)
        maxAmp += amp;
        amp *= persistence
        freq *= 2
    }

    noise /= maxAmp

    noise = noise * (high - low) / 2 + (high + low) / 2

    return noise;
}

function applyRadialGradientMask(width: number, height: number) {
    const mask: number[][] = [];

    const euclideanDistance = (point1: { x: number, y: number }, point2: { x: number, y: number }) => {
        return Math.sqrt(
            Math.abs(Math.pow(point1.x - point2.x, 2)) +
            Math.abs(Math.pow(point1.y - point2.y, 2))
        )
    }

    const centerPoint = { x: Math.floor(width / 2), y: Math.floor(height / 2) }

    const furthestDistanceFromCentre = euclideanDistance(
        { x: 0, y: 0 }, centerPoint
    )

    for (let x = 0; x < width; x++) {
        mask[x] = []
        for (let y = 0; y < height; y++) {
            mask[x][y] = Math.floor(
                furthestDistanceFromCentre - euclideanDistance(
                    { x: x, y: y }, centerPoint
                )
            )
        }
    }

    return mask;
}

export async function generate(width: number, height: number, tiles: number, eSeed: number, pSeed: number, tSeed: number, scale: number, iterations: number) {
    const elevationNoise = makeNoise2D(eSeed)
    const precipitationNoise = makeNoise2D(pSeed)
    const temperatureNoise = makeNoise2D(tSeed)

    const generatedMap: number[] = [];

    const gradientMask = applyRadialGradientMask(width, height)

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const elevation = sumOctave(elevationNoise, iterations, x, y, 0.5, scale, -1, 1, gradientMask[x][y])

            generatedMap.push(elevation)
        }
    }

    return chunks(generatedMap, 100);
}

export async function save(map) {
    console.log(map)
}
