import { db } from "$lib/db"
import { generate } from "$lib/game/world-generator"
import { AccountRole } from "@prisma/client"
import { redirect } from "@sveltejs/kit"
import type { Action, Actions, PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.account) {
        throw redirect(302, '/login')
    }

    if (locals.account.role !== AccountRole.ADMINISTRATOR) {
        throw redirect(302, '/')
    }

    return {
        worlds: await db.world.findMany({
            include: {
                server: true,
                regions: true
            }
        })
    }
}

const createWorld: Action = async ({ request }) => {
    const map = await generate(100, 100, 100, `${new Date().getTime()}`, 'seed', 'seed')

    return {
        map: map
    }
}

export const actions: Actions = { createWorld }
