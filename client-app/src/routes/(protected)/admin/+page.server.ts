import type { PageServerLoad } from "./$types"
import { redirect } from "@sveltejs/kit"
import { AccountRole } from "@prisma/client"

export const load: PageServerLoad = async ({ locals }) => {
}