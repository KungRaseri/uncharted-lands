import { fail } from "@sveltejs/kit"
import { db } from "$lib/db"
import type { PageServerLoad, Actions, Action } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
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

const generateWorld: Action = async ({ request }) => {
    const data = await request.formData();
    const regionMax = data.get('regionMax');
    const tilesPerRegion = data.get('tilesPerRegion');

    if (typeof regionMax !== 'string' ||
        !regionMax ||
        typeof tilesPerRegion !== 'string' ||
        !tilesPerRegion) {
        return fail(400, { invalid: true })
    }
}

export const actions: Actions = { generateWorld }
