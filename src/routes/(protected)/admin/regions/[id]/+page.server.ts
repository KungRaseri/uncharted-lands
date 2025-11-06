import { fail } from "@sveltejs/kit"
import { db } from "$lib/db"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
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
            tiles: {
                include: {
                    Plots: true
                }
            }
        }
    });

    if (!region) {
        throw fail(404, { success: false, id: params.id })
    }

    return {
        region
    }
}