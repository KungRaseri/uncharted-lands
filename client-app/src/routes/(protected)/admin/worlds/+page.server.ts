import type { PageServerLoad, Action, Actions } from "./$types"
import { fail, json, redirect } from "@sveltejs/kit"
import { AccountRole, type Region, type Tile, type World } from "@prisma/client"
import { db } from "$lib/db"
import { generate } from '$lib/game/world-generator'

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
