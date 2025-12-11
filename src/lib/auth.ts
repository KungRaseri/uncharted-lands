import type { Cookies } from '@sveltejs/kit';
import { SERVER_API_URL } from '$env/static/private';
import { logger } from './utils/logger';

export const AuthenticateUser = async (cookies: Cookies) => {
	const session = cookies.get('session');

	if (!session) {
		return null;
	}

	try {
		// Call the REST API to validate the session
		const response = await fetch(`${SERVER_API_URL}/auth/validate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				token: session
			})
		});

		if (!response.ok) {
			return null;
		}

		const result = await response.json();
		return result.account;
	} catch (error) {
		logger.error('[AUTH] Validation error', error);
		return null;
	}
};
