import { API_URL } from "$lib/config";
import { fail, redirect } from "@sveltejs/kit";
import type { Action, Actions, PageServerLoad } from "./$types";
import bcrypt from 'bcrypt';
import { TimeSpan } from "$lib/timespan";

export const load: PageServerLoad = async ({ locals, url }) => {
    if (locals.account)
        throw redirect(302, '/')

    return {
        redirectTo: url.searchParams.get('redirectTo') ?? '/'
    }
}

const login: Action = async ({ cookies, request, url, fetch }) => {
    const data = await request.formData();
    const email = data.get('email');
    const password = data.get('password');
    const rememberMeIsChecked = data.get('remember_me');

    if (typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email ||
        !password) {
        return fail(400, { email, invalid: true })
    }

    // Hash the password before sending to API
    const hashedPassword = await bcrypt.hash(password, 10);

    // Call the REST API
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email,
            password: hashedPassword
        })
    });

    if (!response.ok) {
        return fail(400, { email, incorrect: true })
    }

    const result = await response.json();
    const userAuthToken = result.account.userAuthToken;

    const ts = new TimeSpan();
    ts.days = 30;

    const age30d = ts.totalSeconds
    ts.days = 0;
    ts.hours = 6;
    const age6h = ts.totalSeconds

    cookies.set('session', userAuthToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: (rememberMeIsChecked) ? age30d : age6h // 30 days if remember me is checked, otherwise it's 6 hours
    })

    throw redirect(303, url.searchParams.get('redirectTo') ?? '/');
}

export const actions: Actions = { login }