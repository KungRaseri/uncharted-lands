import { db } from "$lib/db";
import { invalid, redirect } from "@sveltejs/kit";
import type { Action, Actions, PageServerLoad } from "./$types";
import bcrypt from 'bcrypt';

export const load: PageServerLoad = async ({ locals }) => {
    if (locals.account) {
        return redirect(302, '/')
    }
}

const login: Action = async ({ cookies, request }) => {
    const data = await request.formData();
    const email = data.get('email');
    const password = data.get('password');
    const rememberMeIsChecked = data.get('remember_me');

    if (typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email ||
        !password) {
        return invalid(400, { invalid: true })
    }

    const account = await db.account.findUnique({
        where: { email }
    })

    if (!account) {
        return invalid(400, { invalid: true, account_info: "Invalid account information" })
    }

    const userPassword = await bcrypt.compare(password, account.passwordHash);

    if (!userPassword) {
        return invalid(400, { invalid: true, credentials: "Invalid credentials" })
    }

    const authenticatedUser = await db.account.update({
        where: { email: account.email },
        data: { userAuthToken: crypto.randomUUID() }
    })

    cookies.set('session', authenticatedUser.userAuthToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: (rememberMeIsChecked) ? 60 * 60 * 24 * 30 : 60 * 60 * 6 // 30 days if remember me is checked, otherwise it's 6 hours
    })

    throw redirect(302, '/');
}

export const actions: Actions = { login }