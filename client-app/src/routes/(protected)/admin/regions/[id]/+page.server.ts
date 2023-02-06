import { fail, redirect, Server } from "@sveltejs/kit"
import { AccountRole } from "@prisma/client"
import { db } from "$lib/db"
import type { PageServerLoad, Actions, Action } from "./$types"

export const load: PageServerLoad = async ({ locals, params }) => {
    const region = await db.region.findUnique({
        where: {
            id: params.id
        },
        include: {
            world: {
                include: {
                    server: true
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