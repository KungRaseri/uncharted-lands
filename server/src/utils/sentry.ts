/**
 * Sentry Configuration for Server
 *
 * Error tracking, performance monitoring, profiling, and structured logging
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

/**
 * Check if Sentry is enabled
 */
export function isSentryEnabled(): boolean {
	const dsn = process.env.SENTRY_DSN;
	return dsn !== 'disabled' && dsn !== undefined && dsn !== '';
}

/**
 * Initialize Sentry
 */
export function initSentry(): void {
	if (!isSentryEnabled()) {
		console.log('Sentry disabled (SENTRY_DSN not configured)');
		return;
	}

	const environment = process.env.NODE_ENV || 'development';
	const release = process.env.SENTRY_RELEASE || 'uncharted-lands-server@dev';

	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		environment,
		release,

		// Performance Monitoring
		tracesSampleRate: environment === 'production' ? 0.1 : 1, // 10% in prod, 100% in dev

		// Profiling
		profilesSampleRate: environment === 'production' ? 0.1 : 1,

		// Enable structured logs to Sentry
		enableLogs: true,

		// Integrations
		integrations: [
			// Profiling
			nodeProfilingIntegration(),

			// HTTP integration (automatic breadcrumbs)
			Sentry.httpIntegration(),

			// Express integration (automatic instrumentation)
			Sentry.expressIntegration(),

			// Console logging integration - send console.log, console.warn, console.error to Sentry
			Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] }),
		],

		// Error filtering
		ignoreErrors: [
			// Rate limit errors
			'Too Many Requests',
			'RATE_LIMIT_EXCEEDED',

			// Client disconnects
			'ECONNRESET',
			'EPIPE',
			'ECANCELED',

			// Authentication errors (expected)
			'NO_SESSION',
			'INVALID_SESSION',
			'NOT_ADMIN',
		],

		// Before send hook - add custom context
		beforeSend(event, _hint) {
			// Add custom tags
			if (event.request) {
				event.tags = {
					...event.tags,
					requestId: event.request.headers?.['x-request-id'],
				};
			}

			// Log to console in development
			if (environment === 'development') {
				console.warn('Sentry event captured', {
					eventId: event.event_id,
					message: event.message,
					level: event.level,
				});
			}

			return event;
		},

		// Breadcrumb filtering
		beforeBreadcrumb(breadcrumb, _hint) {
			// Don't send HTTP breadcrumbs for health checks
			if (breadcrumb.category === 'http' && breadcrumb.data?.url?.includes('/health')) {
				return null;
			}

			return breadcrumb;
		},
	});

	console.log('Sentry initialized', {
		environment,
		release,
		tracesSampleRate: environment === 'production' ? 0.1 : 1,
		logsEnabled: true,
	});
}

/**
 * Get Sentry logger for structured logging
 * Use this for logging that should be sent to Sentry
 */
export const sentryLogger = Sentry.logger;

/**
 * Capture exception with context
 * Use this in try-catch blocks or areas where exceptions are expected
 */
export function captureException(error: unknown, context?: Record<string, unknown>): string {
	if (!isSentryEnabled()) {
		return '';
	}

	return Sentry.captureException(error, {
		extra: context,
	});
}

/**
 * Capture message with context
 */
export function captureMessage(
	message: string,
	level: Sentry.SeverityLevel = 'info',
	context?: Record<string, unknown>
): string {
	if (!isSentryEnabled()) {
		return '';
	}

	return Sentry.captureMessage(message, {
		level,
		extra: context,
	});
}

/**
 * Set user context
 */
export function setUserContext(user: { id: string; email?: string; username?: string }): void {
	if (!isSentryEnabled()) {
		return;
	}

	Sentry.setUser({
		id: user.id,
		email: user.email,
		username: user.username,
	});
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
	if (!isSentryEnabled()) {
		return;
	}

	Sentry.setUser(null);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(
	message: string,
	category: string,
	data?: Record<string, unknown>
): void {
	if (!isSentryEnabled()) {
		return;
	}

	Sentry.addBreadcrumb({
		message,
		category,
		data,
		level: 'info',
		timestamp: Date.now() / 1000,
	});
}

/**
 * Start a span for performance monitoring
 * Use this to measure meaningful actions like API calls, database queries, etc.
 *
 * @example
 * ```typescript
 * const result = await startSpan(
 *   { op: 'db.query', name: 'Find User by ID' },
 *   async (span) => {
 *     span?.setAttribute('userId', userId);
 *     return await db.query.users.findFirst({ where: eq(users.id, userId) });
 *   }
 * );
 * ```
 */
export async function startSpan<T>(
	context: { op: string; name: string; attributes?: Record<string, string | number | boolean> },
	callback: (span: ReturnType<typeof Sentry.getActiveSpan> | undefined) => Promise<T>
): Promise<T> {
	if (!isSentryEnabled()) {
		return callback(undefined);
	}

	return Sentry.startSpan(
		{
			op: context.op,
			name: context.name,
			attributes: context.attributes,
		},
		callback
	);
}

/**
 * Flush events (useful before shutdown)
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
	if (!isSentryEnabled()) {
		return true;
	}

	return Sentry.close(timeout);
}

// Re-export Sentry for advanced usage
export * as Sentry from '@sentry/node';
