import { fail, redirect } from "@sveltejs/kit"
import { AccountRole } from "@prisma/client"
import { db } from "$lib/db"
import type { PageServerLoad, Actions, Action } from "./$types"

export const load: PageServerLoad = async ({ locals, params }) => {
    if (locals.account.role !== AccountRole.ADMINISTRATOR) {
        throw redirect(302, '/')
    }

    return {
        server: db.server.findUnique({
            where: {
                id: params.id
            },
            include: {
                worlds: true,
                playerProfiles: true
            }
        })
    }
}

const generateWorld: Action = async ({ request, params }) => {
    const data = await request.formData();
    const regionMax = data.get('regionMax');
    const tilesPerRegion = data.get('tilesPerRegion');

    const regions = await db.region.findMany();
    const tiles = await db.tile.findMany();
    const tileResources = await db.tileResource.findMany();

    if (typeof regionMax !== 'string' ||
        !regionMax ||
        typeof tilesPerRegion !== 'string' ||
        !tilesPerRegion) {
        return fail(400, { invalid: true })
    }

    const world = await db.world.create({
        data: {
            index: await db.world.count(),
            serverId: params.id
        },
        include: {
            Server: true
        }
    })

    for (let i = 0; i < Number.parseInt(regionMax); i++) {
        const region = await db.region.create({
            data: {
                index: i,
                worldId: world.id
            },
            include: {
                World: true
            }
        })
        for (let j = 0; j < Number.parseInt(tilesPerRegion); j++) {
            await db.tile.create({
                data: {
                    index: (i + 1) * (j + 1),
                    resources: {
                        createMany: {
                            data: [
                                {
                                    resource: "FOOD",
                                    value: 3
                                },
                                {
                                    resource: "WATER",
                                    value: 2
                                }
                            ]
                        }
                    },
                    regionId: region.id
                },
                include: {
                    resources: true,
                    Region: true
                }
            })
        }
    }

    throw redirect(302, request.url)
}

export const actions: Actions = { generateWorld }
