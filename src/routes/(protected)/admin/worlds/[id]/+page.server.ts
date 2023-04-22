import { fail } from "@sveltejs/kit"
import { db } from "$lib/db"
import type { PageServerLoad, Actions, Action } from "./$types"
import { TileType } from "@prisma/client";

export const load: PageServerLoad = async ({ params }) => {
    const world = await db.world.findUnique({
        where: {
            id: params.id
        },
        include: {
            regions: {
                orderBy: {
                    name: 'asc'
                },
                include: {
                    tiles: {
                        include: {
                            Plots: {
                                include: {
                                    Settlement: true
                                }
                            },
                            Biome: true
                        }
                    }
                }
            },
            server: true
        }
    });

    if (!world) {
        throw fail(404, { success: false, id: params.id })
    }

    const [landTiles, oceanTiles, settlements] = await db.$transaction([
        db.tile.count({
            where: {
                type: TileType.LAND,
                Region: {
                    worldId: world.id
                }
            }
        }),
        db.tile.count({
            where: {
                type: TileType.OCEAN,
                Region: {
                    worldId: world.id
                }
            }
        }),
        db.settlement.count({
            where: {
                Plot: {
                    Tile: {
                        Region: {
                            worldId: world.id
                        }
                    }
                },
            }
        })
    ])

    return {
        world,
        worldInfo: {
            landTiles,
            oceanTiles,
            settlements
        }
    }
}

const generateWorld: Action = async ({ request }) => {
    const data = await request.formData();
    const regionMax = data.get('regionMax');
    const tilesPerRegion = data.get('tilesPerRegion');

    if (typeof regionMax !== 'string' ||
        !regionMax ||
        typeof tilesPerRegion !== 'string' ||
        !tilesPerRegion) {
        return fail(400, { invalid: true })
    }
}

export const actions: Actions = { generateWorld }
