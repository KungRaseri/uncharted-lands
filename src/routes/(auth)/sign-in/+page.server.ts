import { API_URL } from "$lib/config";
import { fail, redirect } from "@sveltejs/kit";
import type { Action, Actions, PageServerLoad } from "./$types";
import { TimeSpan } from "$lib/timespan";
import { logger } from "$lib/utils/logger";

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

    logger.debug('[AUTH] Login attempt', {
        email: email ? `${email.toString().substring(0, 3)}***` : 'missing',
        hasPassword: !!password,
        rememberMe: !!rememberMeIsChecked,
        timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
        logger.warn('[AUTH] Login validation failed - missing fields');
        return fail(400, { email, invalid: true, missingFields: true })
    }

    try {
        // Send plain password to API (server will handle hashing/comparison)
        // This is secure when using HTTPS
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password // Plain password - server will compare with bcrypt
            })
        });

        if (!response.ok) {
            const error = await response.json();
            
            logger.debug('[AUTH] Login failed', {
                status: response.status,
                code: error.code,
                error: error.error
            });

            // Handle specific error codes
            if (error.code === 'INVALID_CREDENTIALS') {
                return fail(401, { 
                    email, 
                    incorrect: true,
                    message: 'The email or password you entered is incorrect.'
                });
            }

            if (error.code === 'MISSING_FIELDS') {
                return fail(400, { 
                    email, 
                    invalid: true, 
                    missingFields: true,
                    message: 'Please provide both email and password.'
                });
            }

            return fail(400, { 
                email, 
                incorrect: true,
                message: 'Login failed. Please check your credentials and try again.'
            });
        }

        const result = await response.json();
        const userAuthToken = result.account.userAuthToken;

        logger.info('[AUTH] ✓ Login successful');

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
            maxAge: (rememberMeIsChecked) ? age30d : age6h
        })

        throw redirect(303, url.searchParams.get('redirectTo') ?? '/');
    } catch (error) {
        // Re-throw redirects
        if (error instanceof Error && error.message.includes('redirect')) {
            throw error;
        }

        logger.error('[AUTH] Login error', error);
        return fail(500, { 
            email,
            invalid: true,
            message: 'An unexpected error occurred. Please try again later.'
        });
    }
}

export const actions: Actions = { login }