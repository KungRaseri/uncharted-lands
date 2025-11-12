import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { AuthenticateUser } from '$lib/auth';
import * as Sentry from '@sentry/node';
import { logger } from '$lib/utils/logger';

Sentry.init({
	dsn: process.env.SENTRY_DSN === 'disabled' ? undefined : process.env.SENTRY_DSN,
	tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
	environment: process.env.NODE_ENV || 'development',

	// Ignore common errors that are not actionable
	ignoreErrors: [
		// Network errors
		'ECONNRESET',
		'EPIPE',
		'ETIMEDOUT',
		// Expected auth errors
		'Unauthorized',
		'Forbidden'
	],

	beforeSend(event, hint) {
		// Filter out errors we don't want to track
		const error = hint.originalException;

		if (error instanceof Error) {
			// Don't send network/timeout errors
			if (
				error.message.includes('ECONNRESET') ||
				error.message.includes('EPIPE') ||
				error.message.includes('timeout')
			) {
				return null;
			}
		}

		// Add custom tags
		event.tags = {
			...event.tags,
			client: 'server-adapter'
		};

		return event;
	}
});

export const handle: Handle = (async ({ event, resolve }) => {
	const user = await AuthenticateUser(event.cookies);

	if (user) {
		if (user.role !== 'ADMINISTRATOR' && event.route.id?.includes('(protected)/admin'))
			throw redirect(307, `/sign-in?redirectTo=${event.url.pathname}`);

		event.locals.account = user;
	} else if (event.route.id?.includes('(protected)')) {
		throw redirect(307, `/sign-in?redirectTo=${event.url.pathname}`);
	}

	const response = await resolve(event);
	return response;
}) satisfies Handle;

export const handleError: HandleServerError = (async ({ error, event }) => {
	const errorId = crypto.randomUUID();

	// Comprehensive error logging using centralized logger
	logger.error('[SERVER ERROR]', error, {
		errorId,
		url: event.url.pathname,
		route: event.route.id,
		method: event.request.method,
		params: event.params,
		account: event.locals.account
			? {
					id: event.locals.account.id,
					email: event.locals.account.email,
					role: event.locals.account.role
				}
			: 'No account'
	});

	Sentry.withScope((scope) => {
		scope.setTag('errorId', errorId);
		Sentry.captureException(error);
	});

	return {
		message: `${event.url.search} at ${event.url.pathname} failed.`,
		errorId
	};
}) satisfies HandleServerError;
