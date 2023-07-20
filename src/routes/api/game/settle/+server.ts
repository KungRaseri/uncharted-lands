import { db } from '$lib/db';
import type { Profile, Server, World } from '@prisma/client';
import { fail, redirect } from '@sveltejs/kit';


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

export async function POST({ request, locals }): Promise<Response> {
    const data = await request.formData();

    const serverData: Server = await new Response(data.get('server')).json();
    const worldData: World = await new Response(data.get('world')).json();
    const profileData: Profile = await new Response(data.get('profile')).json();

    if (!serverData ||
        !worldData ||
        !profileData) {
        throw fail(400, { invalid: true, message: 'Some properties were invalid or were not provided.' })
    }

    // choose a random tile to settle in for now
    const chosenPlot = await getRandomPlot(worldData.id);

    await db.$transaction(async (tx) => {
        const profile = await tx.profile.create({
            data: {
                username: profileData.username,
                account: {
                    connect: {
                        id: locals.account.id
                    }
                },
                picture: `https://via.placeholder.com/128x128?text=${profileData.username.charAt(0).toUpperCase()}`,
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
                        id: serverData.id
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