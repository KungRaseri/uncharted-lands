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
        include: {
            profile: true
        }
    })

    if (!account) {
        return null;
    }


    return account
}