import type { LayoutServerLoad } from "../$types";
import { redirect } from "@sveltejs/kit";


export const load: LayoutServerLoad = async ({ locals }) => {
    if (!locals.account) {
        throw redirect(307, '/login')
    }
}