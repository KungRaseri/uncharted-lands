import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    const server = await db.server.findFirst();
    
    if (!server) {
        throw new Error('No server found');
    }

    const world = await db.world.findUnique({
        where: {
            name_serverId: {
                name: "World 4",
                serverId: server.id
            }
        },
        include: {
            server: true,
            regions: {
                include: {
                    tiles: {
                        include: {
                            Biome: true,
                            Plots: true
                        }
                    }
                }
            }
        }
    })

    if (!world) {
        throw new Error('World not found');
    }

    return {
        world
    };

}) satisfies PageServerLoad;