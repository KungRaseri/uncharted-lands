import type { PageServerLoad } from "./$types"
import { redirect } from "@sveltejs/kit"
import { AccountRole } from "@prisma/client"

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.account) {
        throw redirect(307, '/')
    }

    if (locals.account.role !== AccountRole.ADMINISTRATOR) {
        throw redirect(302, '/')
    }
}