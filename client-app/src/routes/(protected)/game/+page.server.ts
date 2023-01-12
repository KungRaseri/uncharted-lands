import type { PageServerLoad } from "./$types"
import { redirect } from "@sveltejs/kit"
import { AccountRole } from "@prisma/client"

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.account) {
        throw redirect(302, '/login');
    }

    if (!locals.account.playerProfiles) {
        throw redirect(302, '/game/getting-started')
    }
}