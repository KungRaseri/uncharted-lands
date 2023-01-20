import { db } from "$lib/db";
import { Biome, type World, Resource, type TileResource, type Tile } from "@prisma/client";
import { createNoise2D } from 'simplex-noise';
import alea from 'alea';
const eRNG = alea('redsyndicate-elevation');
const mRNG = alea('redsyndicate-moisture');
const tRNG = alea('redsyndicate-temperature');
const elevationNoise = createNoise2D(eRNG)
const moistureNoise = createNoise2D(mRNG)
const temperatureNoise = createNoise2D(tRNG)

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

export async function generate(worldId: string, regionMax: number, tilesPerRegion: number) {
    const regions = [];

    for (let i = 0; i < regionMax; i++) {
        const region = await db.region.create({
            data: {
                worldId
            },
            include: {
                world: true,
                tiles: true
            }
        })

        for (let j = 0; j < tilesPerRegion; j++) {
            const nx = j
            const ny = i

            let e = 1 * (elevationNoise(1 * nx, 1 * ny))
                + 0.5 * (elevationNoise(2 * nx, 2 * ny))
                + 0.25 * (elevationNoise(4 * nx, 4 * ny))
            e = e / (1 + 0.5 + 0.25)

            let m = 1 * (moistureNoise(1 * nx, 1 * ny))
                + 0.75 * (moistureNoise(2 * nx, 2 * ny))
                + 0.33 * (moistureNoise(4 * nx, 4 * ny))
            m = m / (1 + 0.75 + 0.33)

            let t = 1 * (temperatureNoise(1 * nx, 1 * ny))
                + 0.75 * (temperatureNoise(2 * nx, 2 * ny))
                + 0.33 * (temperatureNoise(4 * nx, 4 * ny))
            t = t / (1 + 0.75 + 0.33)

            console.log('e/m', { elevation: e, moisture: m, temperature: t })

            const biome = determineBiome(e, m)

            let tile = await db.tile.create({
                data: {
                    biome: biome,
                    elevation: e,
                    moisture: m,
                    regionId: region.id,
                },
                include: {
                    region: true,
                    resources: true,
                    settlement: true
                }
            })

            await db.tileResource.createMany({
                data: determineTileResources(tile)
            })

            const tileResources = await db.tileResource.findMany({
                where: {
                    tileId: tile.id
                },
                select: {
                    id: true
                }
            })

            tile = await db.tile.update({
                where: {
                    id: tile.id
                },
                data: {
                    resources: {
                        connect: tileResources
                    }
                },
                include: {
                    resources: true,
                    region: true,
                    settlement: true
                }
            })

            region.tiles[j] = tile

            regions[i] = region;
        }

        await db.region.update({
            where: {
                id: region.id
            },
            data: {
                tiles: {
                    connect: region.tiles.map(t => {
                        return {
                            id: t.id
                        }
                    })
                }
            }
        })
    }

    const generatedWorld = await db.world.update({
        where: {
            id: worldId
        },
        data: {
            regions: {
                connect: regions.map(r => { return { id: r.id } })
            }
        },
        include: {
            regions: true,
            server: true
        }
    })

    return generatedWorld;
}