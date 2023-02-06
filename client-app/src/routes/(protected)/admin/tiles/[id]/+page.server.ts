import { fail, redirect, Server } from "@sveltejs/kit"
import { AccountRole } from "@prisma/client"
import { db } from "$lib/db"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals, params }) => {
    const tile = await db.tile.findUnique({
        where: {
            id: params.id
        },
        include: {
            region: true,
            resources: true,
            settlement: true
        }
    });

    if (!tile) {
        throw fail(404, { success: false, id: params.id })
    }

    return {
        tile
    }
}