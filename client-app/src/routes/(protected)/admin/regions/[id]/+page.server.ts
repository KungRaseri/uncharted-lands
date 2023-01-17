import { fail, redirect, Server } from "@sveltejs/kit"
import { AccountRole } from "@prisma/client"
import { db } from "$lib/db"
import type { PageServerLoad, Actions, Action } from "./$types"

export const load: PageServerLoad = async ({ locals, params }) => {
    if (!locals.account) {
        throw redirect(302, '/login')
    }

    if (locals.account.role !== AccountRole.ADMINISTRATOR) {
        throw redirect(302, '/')
    }

    const region = await db.region.findUnique({
        where: {
            id: params.id
        },
        include: {
            World: {
                include: {
                    Server: true
                }
            },
            tiles: true
        }
    });

    if (!region) {
        throw fail(404, { success: false, id: params.id })
    }

    return {
        region
    }
}