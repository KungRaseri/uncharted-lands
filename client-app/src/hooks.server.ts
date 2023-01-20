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
        include: {
            profile: true
        }
    })

    if (account) {
        event.locals.account = {
            id: account.id,
            email: account.email,
            role: account.role,
            userAuthToken: account.userAuthToken,
            profile: account.profile,
            createdAt: account.createdAt,
            updatedAt: account.updatedAt,
            passwordHash: ''
        }
    }

    return await resolve(event);
}