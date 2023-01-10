import type { PageServerLoad } from "./$types"
import { redirect } from "@sveltejs/kit"



export const load: PageServerLoad = async ({ locals }) => {
    if (locals.account.role !== "ADMIN") {
        throw redirect(302, '/login')
    }
}