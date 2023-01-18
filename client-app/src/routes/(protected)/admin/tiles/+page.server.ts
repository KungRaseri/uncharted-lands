import type { PageServerLoad, Action, Actions } from "./$types"
import { fail, redirect } from "@sveltejs/kit"
import { AccountRole, type Region, type Tile, type World } from "@prisma/client"
import { db } from "$lib/db"

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.account) {
        throw redirect(302, '/login')
    }

    if (locals.account.role !== AccountRole.ADMINISTRATOR) {
        throw redirect(302, '/')
    }

    return {
        tiles: db.tile.findMany({
            include: {
                region: true,
                resources: true,
                settlement: true
            }
        })
    }
}
