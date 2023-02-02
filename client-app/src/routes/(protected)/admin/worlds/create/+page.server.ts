import { db } from "$lib/db"
import { generate } from "$lib/game/world-generator"
import { AccountRole } from "@prisma/client"
import { fail, redirect } from "@sveltejs/kit"
import type { Action, Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.account) {
        throw redirect(302, '/login')
    }

    if (locals.account.role !== AccountRole.ADMINISTRATOR) {
        throw redirect(302, '/')
    }

    const width = 10, height = 10;

    const iterations = 16;

    const map = await generate(width, height, new Date().getTime(), new Date().getTime(), new Date().getTime(), 1, iterations, 0, 0)

    return {
        map: map,
        worlds: await db.world.findMany({
            include: {
                server: true,
                regions: true
            }
        })
    }
}

const createWorld: Action = async ({ request }) => {
    const data = await request.formData();
    const width = data.get("width")
    const height = data.get("height");
    const xoffset = data.get("xoffset")
    const yoffset = data.get("yoffset");
    const iterations = data.get("iterations")
    const scale = data.get("scale");

    if (typeof width !== 'string' ||
        !width ||
        typeof height !== 'string' ||
        !height ||
        typeof xoffset !== 'string' ||
        !xoffset ||
        typeof yoffset !== 'string' ||
        !yoffset ||
        typeof scale !== 'string' ||
        !scale ||
        typeof iterations !== 'string' ||
        !iterations) {
        return fail(400, { invalid: true })
    }

    const map = await generate(Number.parseInt(width), Number.parseInt(height), new Date().getTime(), new Date().getTime(), new Date().getTime(), Number.parseFloat(scale), Number.parseInt(iterations), Number.parseInt(xoffset), Number.parseInt(yoffset))

    return {
        map: map
    }
}

export const actions: Actions = { createWorld }
