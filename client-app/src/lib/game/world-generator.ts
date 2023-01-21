import { db } from "$lib/db";
import { Biome, type World, Resource, type TileResource, type Tile } from "@prisma/client";
import { createNoise2D, type NoiseFunction2D } from 'simplex-noise';
import alea from 'alea';
import { json } from "@sveltejs/kit";

function determineBiome(elevation: number, moisture: number) {
    if (elevation < 0.0025)
        return Biome.WATER;

    if (elevation < 0.0075)
        return Biome.BEACH

    if (elevation > 0.6) {
        if (moisture < 0.1) {
            //scorched
        }
        if (moisture < 0.2) {
            //bare
        }
        if (moisture < 0.5) {
            //taiga
        }
        return Biome.SNOW
    }


    if (elevation > 0.3) {
        if (moisture < 0.33) return Biome.DESERT
        if (moisture < 0.66) return Biome.SAVANNAH

        return Biome.PLAINS
    }

    if (moisture < 0.16) return Biome.DESERT
    if (moisture < 0.33) return Biome.PLAINS
    if (moisture < 0.66) return Biome.FOREST

    return Biome.JUNGLE
}

function determineTileResources(tile: Tile) {
    const resources: TileResource[] = [];

    switch (tile.biome) {
        case Biome.WATER:
            resources.push({
                resource: Resource.FOOD,
                value: 2,
                id: crypto.randomUUID(),
                tileId: tile.id
            })
            resources.push({
                resource: Resource.WATER,
                value: 5,
                id: crypto.randomUUID(),
                tileId: tile.id
            })
            break;
        case Biome.BEACH:
            resources.push({
                resource: Resource.FOOD,
                value: 2,
                id: crypto.randomUUID(),
                tileId: tile.id
            })
            resources.push({
                resource: Resource.WATER,
                value: 1,
                id: crypto.randomUUID(),
                tileId: tile.id
            })
            break;
        case Biome.PLAINS:
            resources.push({
                resource: Resource.FOOD,
                value: 3,
                id: crypto.randomUUID(),
                tileId: tile.id
            })
            resources.push({
                resource: Resource.WATER,
                value: 2,
                id: crypto.randomUUID(),
                tileId: tile.id
            })
            break;
        case Biome.DESERT:
            resources.push({
                resource: Resource.FOOD,
                value: 3,
                id: crypto.randomUUID(),
                tileId: tile.id
            })
            resources.push({
                resource: Resource.WATER,
                value: 2,
                id: crypto.randomUUID(),
                tileId: tile.id
            })
            break;
        case Biome.SNOW:
            resources.push({
                resource: Resource.FOOD,
                value: 1,
                id: crypto.randomUUID(),
                tileId: tile.id
            })
            resources.push({
                resource: Resource.WATER,
                value: 2,
                id: crypto.randomUUID(),
                tileId: tile.id
            })
            break;
    }

    return resources;
}

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

function sumOctave(noiseFunc: NoiseFunction2D, iterations: number, x: number, y: number, persistence: number, scale: number, low: number, high: number) {
    let maxAmp = 0;
    let amp = 1;
    let freq = scale;
    let noise = 0

    for (let i = 0; i < iterations; i++) {
        noise += noiseFunc(x * freq, y * freq) * amp
        maxAmp += amp;
        amp *= persistence
        freq *= 2
    }

    noise /= maxAmp

    noise = noise * (high - low) / 2 + (high + low) / 2

    return noise;
}

export async function generate(width: number, height: number, tiles: number, eSeed: string, mSeed: string, tSeed: string) {
    const eRNG = alea(`${eSeed}`);
    const pRNG = alea(`${mSeed}`);
    const tRNG = alea(`${tSeed}`);

    const elevationNoise = createNoise2D(eRNG)
    const moistureNoise = createNoise2D(pRNG)
    const temperatureNoise = createNoise2D(tRNG)

    const scale = 0.0125;
    const generatedMap: number[] = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const elevation = sumOctave(elevationNoise, 16, x, y, 0.5, scale, -1, 1)

            generatedMap.push(elevation)
        }
    }

    return chunks(generatedMap, 100);
}

export async function save(map) {
    console.log(map)
}
