import { fail, redirect, Server } from "@sveltejs/kit"
import { AccountRole } from "@prisma/client"
import { db } from "$lib/db"
import type { PageServerLoad, Actions, Action } from "./$types"
import { generate } from "$lib/game/world-generator"

export const load: PageServerLoad = async ({ locals, params }) => {
    const server = await db.server.findUnique({
        where: {
            id: params.id
        },
        include: {
            worlds: true,
            profileServerData: {
                include: {
                    profile: true,
                    settlements: true
                }
            }
        }
    });

    if (!server) {
        throw fail(404, { success: false, id: params.id })
    }

    return {
        server
    }
}
