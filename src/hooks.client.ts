import type { HandleClientError } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import * as Sentry from '@sentry/svelte';

Sentry.init({
	dsn: env.PUBLIC_SENTRY_DSN === 'disabled' ? undefined : env.PUBLIC_SENTRY_DSN,
	integrations: [
		Sentry.browserTracingIntegration(),
		Sentry.replayIntegration({
			maskAllText: false,
			blockAllMedia: false,
		}),
	],
	// Adjust sample rates for production
	tracesSampleRate: env.PUBLIC_ENV === 'production' ? 0.1 : 1,
	replaysSessionSampleRate: env.PUBLIC_ENV === 'production' ? 0.1 : 1,
	replaysOnErrorSampleRate: 1,
	environment: env.PUBLIC_ENV || 'development',
	
	// Ignore common errors that are not actionable
	ignoreErrors: [
		// Network errors
		'NetworkError',
		'Failed to fetch',
		'Load failed',
		'Network request failed',
		// Browser extensions
		'chrome-extension://',
		'moz-extension://',
		// WebSocket disconnections (expected)
		'WebSocket is already in CLOSING or CLOSED state',
		'WebSocket connection to',
	],

	beforeSend(event, hint) {
		// Filter out errors we don't want to track
		const error = hint.originalException;

		if (error instanceof Error) {
			// Don't send network errors
			if (error.message.includes('fetch') || error.message.includes('Network')) {
				return null;
			}
		}

		// Add custom tags
		event.tags = {
			...event.tags,
			client: 'web',
		};

		return event;
	},
});

export const handleError: HandleClientError = (async ({ error, event }) => {
	const errorId = crypto.randomUUID();

	// Comprehensive error logging
	console.error('\n========================================');
	console.error('🚨 CLIENT ERROR:', errorId);
	console.error('========================================');
	console.error('URL:', event.url?.pathname);
	console.error('Error:', error);

	if (error instanceof Error) {
		console.error('Message:', error.message);
		console.error('Stack:', error.stack);
	}

	console.error('Event details:', {
		url: event.url?.href,
		params: event.params
	});
	console.error('========================================\n');

	Sentry.withScope((scope) => {
		scope.setExtra('event', event);
		scope.setExtra('errorId', errorId);

		Sentry.captureException(error);
	});

	return {
		message: 'Whoops!',
		errorId
	};
}) satisfies HandleClientError;
