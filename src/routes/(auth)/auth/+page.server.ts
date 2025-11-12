import { redirect } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';
import type { Action, Actions } from './$types';

const signout: Action = async ({ cookies, locals }) => {
	logger.info('[AUTH] User signed out', {
		accountId: locals.account?.id || 'unknown'
	});

	cookies.delete('session', { path: '/' });
	locals.account = null;

	throw redirect(302, '/');
};

export const actions: Actions = { signout };
