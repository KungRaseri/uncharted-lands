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

    const width = 100, height = 100;

    const iterations = 16;

    const map = await generate(width, height, 100, new Date().getTime(), new Date().getTime(), new Date().getTime(), 100 / 1000, iterations)

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
    const iterations = data.get("iterations")
    const scale = data.get("scale");

    if (typeof scale !== 'string' ||
        !scale ||
        typeof iterations !== 'string' ||
        !iterations) {
        return fail(400, { invalid: true })
    }

    const map = await generate(500, 500, 100, new Date().getTime(), new Date().getTime(), new Date().getTime(), Number.parseFloat(scale) / 1000, Number.parseInt(iterations))

    return {
        map: map
    }
}

export const actions: Actions = { createWorld }
