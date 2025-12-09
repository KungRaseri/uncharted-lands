import { API_URL } from '$lib/config';
import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import { logger } from '$lib/utils/logger';

/**
 * Handle API error responses
 */
function handleRegistrationError(response: Response, error: { code?: string; error?: string }) {
	logger.debug('[AUTH] Registration failed', {
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
		// If user is already authenticated, redirect to appropriate page
		// If they have a profile (completed onboarding), go to game
		// Otherwise, redirect to getting-started to complete onboarding
		throw redirect(302, locals.account.profile ? '/game' : '/game/getting-started');
	}
};

const register: Action = async ({ cookies, request, fetch }) => {
	const data = await request.formData();
	const email = data.get('email');
	const password = data.get('password');
	const username = data.get('username') || email;

	logger.debug('[AUTH] Registration attempt', {
		email: email ? `${email.toString().substring(0, 3)}***` : 'missing',
		hasPassword: !!password,
		timestamp: new Date().toISOString()
	});

	// Validate required fields
	if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
		logger.warn('[AUTH] Registration validation failed - missing fields');
		return fail(400, { invalid: true, missingFields: true });
	}

	// Validate password length
	if (password.length < 16) {
		logger.warn('[AUTH] Registration validation failed - password too short');
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
		logger.info('[AUTH] ✓ Registration successful');

		// IMPORTANT: Set session cookie BEFORE redirecting to protected route
		// Otherwise the auth middleware will reject the redirect
		cookies.set('session', result.account.userAuthToken, {
			path: '/',
			httpOnly: true,
			sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 6
		});

		// Redirect new users directly to getting-started page
		// They need to choose server, world, and username before playing
		throw redirect(302, '/game/getting-started');
	} catch (error) {
		// Re-throw redirects (SvelteKit redirect objects have a status property)
		if (error && typeof error === 'object' && 'status' in error && 'location' in error) {
			throw error;
		}

		logger.error('[AUTH] Registration error', error);
		return fail(500, {
			invalid: true,
			message: 'An unexpected error occurred. Please try again later.'
		});
	}
};

export const actions: Actions = { register };
