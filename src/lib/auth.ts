import type { Cookies } from "@sveltejs/kit";
import { db } from "./db";

export const AuthenticateUser = async (cookies: Cookies) => {
    const session = cookies.get('session');

    if (!session) {
        return null;
    }

    const account = await db.account.findUnique({
        where: {
            userAuthToken: session
        },
        select: {
            id: true,
            email: true,
            role: true,
            userAuthToken: true,
            profile: true,
            createdAt: true,
            updatedAt: true
        }
    })

    if (!account) {
        return null;
    }


    return account
}