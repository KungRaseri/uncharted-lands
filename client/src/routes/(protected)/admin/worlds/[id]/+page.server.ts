import { fail, redirect } from "@sveltejs/kit"
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

    // Load all servers for reassignment dropdown
    const servers = await db.server.findMany({
        orderBy: { name: 'asc' }
    });

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
        servers,
        worldInfo: {
            landTiles,
            oceanTiles,
            settlements
        }
    }
}

const update: Action = async ({ request, params }) => {
    const data = await request.formData();
    const name = data.get('name');
    const serverId = data.get('serverId');

    if (!name || typeof name !== 'string') {
        return fail(400, { invalid: true, message: 'World name is required' });
    }

    if (!serverId || typeof serverId !== 'string') {
        return fail(400, { invalid: true, message: 'Server is required' });
    }

    try {
        await db.world.update({
            where: { id: params.id },
            data: { 
                name,
                serverId 
            }
        });

        return { success: true, message: 'World updated successfully' };
    } catch (error) {
        console.error('Failed to update world:', error);
        return fail(500, { success: false, message: 'Failed to update world' });
    }
}

const deleteWorld: Action = async ({ params }) => {
    try {
        // Delete world (cascades to regions, tiles, plots due to schema)
        await db.world.delete({
            where: { id: params.id }
        });

        throw redirect(303, '/admin/worlds');
    } catch (error) {
        if (error instanceof Response) throw error; // Re-throw redirect
        console.error('Failed to delete world:', error);
        return fail(500, { success: false, message: 'Failed to delete world' });
    }
}

export const actions: Actions = { update, delete: deleteWorld }
