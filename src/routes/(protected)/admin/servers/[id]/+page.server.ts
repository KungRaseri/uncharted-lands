import { fail } from "@sveltejs/kit"
import { db } from "$lib/db"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
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
