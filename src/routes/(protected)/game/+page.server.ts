import type { PageServerLoad } from "./$types"
import { redirect } from "@sveltejs/kit"
import { db } from "$lib/db"

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.account.profile) {
        throw redirect(302, '/game/getting-started')
    }

    const settlements = await db.settlement.findMany({
        where: {
            playerProfile: {
                profileId: locals.account.profile.id,
                serverId: "90de5a83-8773-47ce-b2ca-fa60c8339611" //TODO: update when server swapping is available
            },
        }
    })

    return {
        settlements
    }
}