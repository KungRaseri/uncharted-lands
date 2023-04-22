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

    const potentialTiles = await db.tile.findMany({
        where: {
            elevation: {
                gt: 0,
                lt: 0.8
            },
            precipitation: {
                gt: -0.5,
                lt: 1
            },
            temperature: {
                gt: -0.5,
                lt: 0.5
            },
            Region: {
                worldId: worldId
            }
        },
        include: {
            Plots: true
        }
    })

    const randomTileIndex = Math.floor(Math.random() * potentialTiles.length)
    const randomTile = potentialTiles[randomTileIndex];

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

    await db.$transaction(async (tx) => {
        const profile = await tx.profile.create({
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

        const serverProfile = await tx.profileServerData.create({
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

        await tx.settlement.create({
            data: {
                name: "Home Settlement",
                Storage: {
                    create: {
                        food: 5,
                        water: 5,
                        wood: 10,
                        stone: 5,
                        ore: 0
                    }
                },
                PlayerProfile: {
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
    })

    // update the player profile and connect it to the server

    throw redirect(302, '/game')
}

export const actions: Actions = { settle }