import type { PageServerLoad } from "./$types"
import { redirect } from "@sveltejs/kit"
import { AccountRole } from "@prisma/client"
import { db } from "$lib/db";

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.account) {
        throw redirect(302, '/login');
    }

    if (!locals.account.profile) {
        throw redirect(302, '/game/getting-started')
    }

    return {
        profile: locals.account.profile
    }
}