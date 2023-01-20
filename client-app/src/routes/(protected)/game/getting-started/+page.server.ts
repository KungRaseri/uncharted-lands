import { db } from '$lib/db';
import { Biome } from '@prisma/client';
import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.account) {
        throw redirect(302, "/login")
    }

    if (locals.account.playerProfiles) {
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
                    biome: Biome.PLAINS
                },
                every: {
                    settlement: undefined
                }
            }
        },
        include: {
            tiles: true
        }
    })

    const soilTiles = potentialRegions[Math.floor(Math.random() * potentialRegions.length)]
        .tiles.filter(t => t.biome === Biome.PLAINS);

    const randomTile = soilTiles[Math.floor(Math.random() * soilTiles.length)]

    return randomTile;
}

const settle: Action = async ({ cookies, request, locals }) => {
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
    const newPlayerProfile = await db.profile.create({
        data: {
            username,
            account: {
                connect: {
                    id: locals.account.id
                }
            },
        }
    })

    const profileServerData = await db.profileServerData.create({
        data: {
            profileId: newPlayerProfile.id,
            serverId: server,
            settlements: {
                create: {
                    name: "Home Settlement",
                    tile: {
                        connect: {
                            id: chosenTile.id
                        }
                    }
                },
            }
        }
    })

    await db.profile.update({
        data: {
            profileServerData: {
                connect: {
                    profileId: newPlayerProfile.id,
                }
            }
        },
        where: {
            id: newPlayerProfile.id
        }
    })

    await db.server.update({
        data: {
            profileServerData: {
                connect: {
                    serverId: profileServerData.serverId
                }
            }
        },
        where: {
            id: server
        }
    })

    await db.account.update({
        data: {
            profile: {
                connect: {
                    id: newPlayerProfile.id
                }
            }
        },
        where: {
            id: locals.account.id
        }
    })

    throw redirect(302, '/game')
}

export const actions: Actions = { settle }