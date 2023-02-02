import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";


export const load: PageServerLoad = async ({ locals, cookies }) => {
    cookies.delete('session');
    locals.account = null;

    throw redirect(302, '/')
}