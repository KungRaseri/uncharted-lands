import type { PageServerLoad } from "./$types"
import { redirect } from "@sveltejs/kit"
import { db } from "$lib/db";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.account.profile) {
        throw redirect(302, '/game/getting-started')
    }
    return {
        profile: locals.account.profile
    }
}