import { db } from "$lib/db"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals, depends }) => {
    // Mark this data as dependent on game state changes
    // When tick occurs, calling invalidate('game:settlements') will refresh this
    depends('game:settlements');
    depends('game:data');

    if (!locals.account.profile) {
        throw redirect(302, '/game/getting-started')
    }

    const settlements = await db.settlement.findMany({
        where: {
            PlayerProfile: {
                profileId: locals.account.profile.id,
                serverId: (await db.server.findFirst())?.id //TODO: update when server swapping is available
            },
        },
        include: {
            Plot: {
                include: {
                    Settlement: true,
                    Tile: true
                }
            },
            Storage: true,
            Structures: {
                include: {
                    modifiers: true
                }
            }
        }
    })

    return {
        settlements,
        lastUpdate: new Date().toISOString()
    }
}