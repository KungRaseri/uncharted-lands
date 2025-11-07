import { API_URL } from '$lib/config';
import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import bcrypt from 'bcrypt';


export const load: PageServerLoad = async ({ locals }) => {
    if (locals.account) {
        throw redirect(302, '/')
    }
}

const register: Action = async ({ cookies, request, fetch }) => {
    const data = await request.formData();
    const email = data.get('email');
    const password = data.get('password');
    const username = data.get('username') || email; // Use email as username if not provided

    if (typeof email !== 'string' ||
        typeof password !== 'string' ||
        !email ||
        !password) {
        return fail(400, { invalid: true })
    }

    if (password.length < 16) {
        return fail(400, { invalid: true, length: true })
    }

    // Hash password before sending
    const hashedPassword = await bcrypt.hash(password, 10);

    // Call the REST API
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email,
            password: hashedPassword,
            username: typeof username === 'string' ? username : email
        })
    });

    if (!response.ok) {
        const error = await response.json();
        if (error.error?.includes('already exists')) {
            return fail(400, { invalid: true, exists: true })
        }
        return fail(400, { invalid: true })
    }

    const result = await response.json();

    cookies.set('session', result.account.userAuthToken, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 6 // 6 hours
    })

    throw redirect(302, '/')
}

export const actions: Actions = { register }