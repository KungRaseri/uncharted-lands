import { fail } from "@sveltejs/kit"
import { db } from "$lib/db"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ params }) => {
    const plot = await db.plot.findUnique({
        where: {
            id: params.id
        },
        include: {
            Settlement: {
                include: {
                    PlayerProfile: {
                        include: {
                            profile: true
                        }
                    },
                    structures: true
                }
            },
            Tile: true,
            attributes: true
        }
    });

    if (!plot) {
        throw fail(404, { success: false, id: params.id })
    }

    return {
        plot
    }
}