import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    const world = await db.world.findUnique({
        where: {
            name_serverId: {
                name: "World 4",
                serverId: (await db.server.findFirst())?.id
            }
        },
        include: {
            server: true,
            regions: {
                include: {
                    tiles: true
                }
            }
        }
    })

    if (world === null || world === undefined) throw Error();

    return {
        world
    };

}) satisfies PageServerLoad;