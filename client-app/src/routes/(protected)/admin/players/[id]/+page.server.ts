import { fail, redirect, Server } from "@sveltejs/kit"
import { AccountRole, type Tile } from "@prisma/client"
import { db } from "$lib/db"
import type { PageServerLoad, Actions, Action } from "./$types"
import { generate } from "$lib/game/world-generator"

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.account) {
        throw redirect(302, '/login')
    }

    if (locals.account.role !== AccountRole.ADMINISTRATOR) {
        throw redirect(302, '/')
    }

    const world = await db.world.findUnique({
        where: {
            id: params.id
        },
        include: {
            regions: {
                include: {
                    tiles: true
                }
            }
        }
    });

    if (!world) {
        throw fail(404, { success: false, id: params.id })
    }

    return {
        world
    }
}

const regenerateWorld: Action = async ({ request, params }) => {
    const world = await db.world.findUnique({
        where: {
            id: params.id
        },
        include: {
            regions: {
                include: {
                    tiles: true
                }
            }
        }
    })

    //clear out tiles

    //generate tiles

}

const generateWorld: Action = async ({ request, params }) => {
    const data = await request.formData();
    const regionMax = data.get('regionMax');
    const tilesPerRegion = data.get('tilesPerRegion');

    if (typeof regionMax !== 'string' ||
        !regionMax ||
        typeof tilesPerRegion !== 'string' ||
        !tilesPerRegion) {
        return fail(400, { invalid: true })
    }

    const world = await db.world.create({
        data: {
            serverId: params.id
        },
        include: {
            server: true
        }
    })

    await generate(world.id, Number.parseInt(regionMax) ?? 1, Number.parseInt(tilesPerRegion) ?? 1)
}

export const actions: Actions = { generateWorld, regenerateWorld }
