import { db } from '$lib/db';
import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.account.profile) {
        throw redirect(302, '/game')
    }
    return {
        servers: await db.server.findMany(),
        worlds: await db.world.findMany(),
        regions: await db.region.findMany(),
        tiles: await db.region.findMany()
    }
}

async function getRandomTile(worldId: string) {
    const worldData = await db.world.findUnique({
        where: {
            id: worldId
        }
    })

    if (!worldData) {
        throw fail(404, { notfound: true })
    }

    const potentialRegions = await db.region.findMany({
        where: {
            worldId: worldData.id,
            tiles: {
                some: {
                    elevation: {
                        gt: 0.1,
                        lt: 0.9
                    }
                },
                every: {
                    Settlement: undefined
                }
            }
        },
        include: {
            tiles: true
        }
    })

    const soilTiles = potentialRegions[Math.floor(Math.random() * potentialRegions.length)]
        .tiles.filter(t => t.elevation > 0.2 && t.elevation < 0.6);

    const randomTile = soilTiles[Math.floor(Math.random() * soilTiles.length)]

    return randomTile;
}

const settle: Action = async ({ request, locals }) => {
    const data = await request.formData();
    const username = data.get('username');
    const server = data.get('server');
    const world = data.get('world');

    if (typeof server !== 'string' ||
        !server ||
        typeof world !== 'string' ||
        !world ||
        typeof username !== 'string' ||
        !username) {
        return fail(400, { invalid: true })
    }

    // choose a random tile to settle in for now
    const chosenTile = await getRandomTile(world);

    // update the player profile and connect it to the server
    await db.profile.create({
        data: {
            username,
            account: {
                connect: {
                    id: locals.account.id
                }
            },
            picture: `https://via.placeholder.com/128x128?text=${username.charAt(0).toUpperCase()}`,
            profileServerData: {
                create: {
                    serverId: server,
                    settlements: {
                        create: {
                            name: "Home Settlement",
                            tile: {
                                connect: {
                                    id: chosenTile.id
                                }
                            },
                            Plot: {
                                create: {
                                    tileId: chosenTile.id
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    throw redirect(302, '/game')
}

export const actions: Actions = { settle }