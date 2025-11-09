import { API_URL } from '$lib/config';
import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Log debug messages in development mode
 */
function logDebug(message: string, context?: Record<string, unknown>) {
    if (isDev) {
        console.log(`[CLIENT AUTH] ${message}`, context || '');
    }
}

/**
 * Log warning messages in development mode
 */
function logWarn(message: string) {
    if (isDev) {
        console.warn(`[CLIENT AUTH] ${message}`);
    }
}

/**
 * Handle API error responses
 */
function handleRegistrationError(response: Response, error: { code?: string; error?: string }) {
    logDebug('Registration failed:', {
        status: response.status,
        code: error.code,
        error: error.error
    });

    if (error.code === 'EMAIL_EXISTS') {
        return fail(400, { 
            invalid: true, 
            exists: true,
            message: 'An account with this email already exists. Please try logging in instead.'
        });
    }

    if (error.code === 'MISSING_FIELDS') {
        return fail(400, { 
            invalid: true, 
            missingFields: true,
            message: 'Please provide both email and password.'
        });
    }

    return fail(400, { 
        invalid: true,
        message: 'Registration failed. Please check your information and try again.'
    });
}


export const load: PageServerLoad = async ({ locals }) => {
    if (locals.account) {
        throw redirect(302, '/')
    }
}

const register: Action = async ({ cookies, request, fetch }) => {
    const data = await request.formData();
    const email = data.get('email');
    const password = data.get('password');
    const username = data.get('username') || email;

    logDebug('Registration attempt:', {
        email: email ? `${email.toString().substring(0, 3)}***` : 'missing',
        hasPassword: !!password,
        timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
        logWarn('Registration validation failed - missing fields');
        return fail(400, { invalid: true, missingFields: true });
    }

    // Validate password length
    if (password.length < 16) {
        logWarn('Registration validation failed - password too short');
        return fail(400, { invalid: true, length: true });
    }

    try {
        // Send plain password to API (server will handle hashing)
        // This is secure when using HTTPS
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                password, // Plain password - server will hash it
                username: typeof username === 'string' ? username : email
            })
        });

        if (!response.ok) {
            const error = await response.json();
            return handleRegistrationError(response, error);
        }

        const result = await response.json();
        logDebug('✓ Registration successful');

        cookies.set('session', result.account.userAuthToken, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 6
        });

        throw redirect(302, '/');
    } catch (error) {
        // Re-throw redirects
        if (error instanceof Error && error.message.includes('redirect')) {
            throw error;
        }

        console.error('[CLIENT AUTH] Registration error:', error);
        return fail(500, { 
            invalid: true,
            message: 'An unexpected error occurred. Please try again later.'
        });
    }
}

export const actions: Actions = { register }