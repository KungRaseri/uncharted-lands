import { db } from "$lib/db"
import { redirect } from "@sveltejs/kit"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.account.profile) {
        throw redirect(302, '/game/getting-started')
    }

    const settlements = await db.settlement.findMany({
        where: {
            PlayerProfile: {
                profileId: locals.account.profile.id,
                serverId: "06fc223b-412d-4bbd-97db-7e43744e046d" //TODO: update when server swapping is available
            },
        },
        include: {
            Plot: {
                include: {
                    resources: true,
                    Tile: true
                }
            },
            structures: {
                include: {
                    modifiers: true
                }
            }
        }
    })

    return {
        settlements
    }
}