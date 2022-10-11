import type { Handle } from "@sveltejs/kit";
import { db } from "$lib/db";

export const handle: Handle = async function ({ event, resolve }) {
    const session = event.cookies.get('session');

    if (!session) {
        return await resolve(event);
    }

    const account = await db.account.findUnique({
        where: {
            userAuthToken: session
        },
        select: { email: true, username: true, role: true }
    })

    if (account) {
        event.locals.account = {
            email: account.email,
            username: account.username,
            role: account.role
        }
    }

    return await resolve(event);
}