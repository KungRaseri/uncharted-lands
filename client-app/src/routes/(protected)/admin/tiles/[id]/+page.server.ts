import { fail, redirect, Server } from "@sveltejs/kit"
import { AccountRole } from "@prisma/client"
import { db } from "$lib/db"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.account) {
        throw redirect(302, '/login')
    }

    if (locals.account.role !== AccountRole.ADMINISTRATOR) {
        throw redirect(302, '/')
    }

    const tile = await db.tile.findUnique({
        where: {
            id: params.id
        },
        include: {
            Region: true,
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