import type { PageServerLoad, Action, Actions } from "./$types"
import { fail, json, redirect } from "@sveltejs/kit"
import { AccountRole, type Region, type Tile, type World } from "@prisma/client"
import { db } from "$lib/db"
import { generate } from '$lib/game/world-generator'

export const load: PageServerLoad = async ({ locals }) => {
    return {
        worlds: await db.world.findMany({
            include: {
                server: true,
                regions: true
            }
        })
    }
}
