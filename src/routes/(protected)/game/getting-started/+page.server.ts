import { db } from '$lib/db';
import { TileType } from '@prisma/client';
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

async function getRandomPlot(worldId: string) {
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
            worldId: worldId,
            tiles: {
                some: {
                    elevation: {
                        gt: 0.2,
                        lt: 0.8
                    },
                    Plots: {
                        some: {
                            Settlement: undefined
                        }
                    }
                },
                every: {
                    type: TileType.LAND
                }
            }
        },
        include: {
            tiles: {
                include: {
                    Plots: true
                }
            }
        }
    })

    const randomRegionIndex = Math.floor(Math.random() * potentialRegions.length)
    const randomTile = potentialRegions[randomRegionIndex]
        .tiles[Math.floor(Math.random() * potentialRegions[randomRegionIndex].tiles.length)];

    const randomPlot = randomTile.Plots[Math.floor(Math.random() * randomTile.Plots.length)]

    return randomPlot;
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
    const chosenPlot = await getRandomPlot(world);

    const profile = await db.profile.create({
        data: {
            username,
            account: {
                connect: {
                    id: locals.account.id
                }
            },
            picture: `https://via.placeholder.com/128x128?text=${username.charAt(0).toUpperCase()}`,
        }
    })

    const serverProfile = await db.profileServerData.create({
        data: {
            profile: {
                connect: {
                    id: profile.id
                }
            },
            server: {
                connect: {
                    id: server
                }
            }
        },
        include: {
            settlements: true
        }
    })

    const settlement = await db.settlement.create({
        data: {
            name: "Home Settlement",
            playerProfile: {
                connect: {
                    profileId: serverProfile.profileId
                }
            },
            Plot: {
                connect: {
                    id: chosenPlot.id
                }
            }
        }
    })

    // update the player profile and connect it to the server

    throw redirect(302, '/game')
}

export const actions: Actions = { settle }