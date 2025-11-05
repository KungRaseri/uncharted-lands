import { redirect } from "@sveltejs/kit";
import type { Action, Actions } from "./$types";

const signout: Action = async ({ cookies, locals }) => {
    cookies.delete('session');
    locals.account = null;

    throw redirect(302, '/');
}

export const actions: Actions = { signout }