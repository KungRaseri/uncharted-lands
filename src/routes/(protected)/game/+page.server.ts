import type { PageServerLoad } from "./$types"
import { redirect } from "@sveltejs/kit"

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.account.profile) {
        throw redirect(302, '/game/getting-started')
    }

    return {
        
    }
}