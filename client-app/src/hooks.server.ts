import { redirect, type Handle } from "@sveltejs/kit";
import { db } from "$lib/db";
import { AuthenticateUser } from "$lib/auth";

export const handle: Handle = async function ({ event, resolve }) {

    const user = await AuthenticateUser(event.cookies);

    if (!user) {
        if (event.route.id?.includes('(protected)'))
            throw redirect(307, `/sign-in?redirectTo=${event.url.pathname}`)

    } else {
        if (user && user.role !== "ADMINISTRATOR" && event.route.id?.includes('(protected)/admin'))
            throw redirect(307, `/sign-in?redirectTo=${event.url.pathname}`)

        event.locals.account = user;
    }


    return await resolve(event);
}