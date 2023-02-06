import type { PageServerLoad, Action, Actions } from "./$types"
import { fail, redirect } from "@sveltejs/kit"
import { AccountRole, type Region, type Tile, type World } from "@prisma/client"
import { db } from "$lib/db"

export const load: PageServerLoad = async ({ locals }) => {
    return {
        regions: db.region.findMany({
            include: {
                world: true,
                tiles: true
            }
        })
    }
}
