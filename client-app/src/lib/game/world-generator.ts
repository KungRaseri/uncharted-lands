import { db } from "$lib/db";
import { TileType, type World, Resource, type TileResource, type Tile } from "@prisma/client";

const resourceTypes = [Resource.FOOD, Resource.WATER, Resource.WOOD, Resource.STONE]
const tileTypes: TileType[] = [TileType.WATER, TileType.SAND, TileType.SOIL, TileType.STONE, TileType.ICE]

function determineTileResources(tile: Tile) {
    const resources: TileResource[] = [];

    switch (tile.type) {
        case TileType.ICE:
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
        case TileType.WATER:
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
        case TileType.SAND:
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
        case TileType.SOIL:
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
        case TileType.STONE:
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
    }

    return resources;
}

export async function generate(worldId: string, regionMax = 10, tilesPerRegion = 10) {
    const regions = [];

    for (let i = 0; i < regionMax; i++) {
        const region = await db.region.create({
            data: {
                worldId
            },
            include: {
                World: true,
                tiles: true
            }
        })

        for (let j = 0; j < tilesPerRegion; j++) {
            const tileType = tileTypes[Math.floor(Math.random() * tileTypes.length)]
            console.log(tileType)

            let tile = await db.tile.create({
                data: {
                    type: tileType,
                    regionId: region.id,
                },
                include: {
                    Region: true,
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
                    Region: true,
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
            Server: true
        }
    })

    return generatedWorld;
}