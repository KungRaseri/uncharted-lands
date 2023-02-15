import type { HandleClientError } from "@sveltejs/kit";
import * as Sentry from '@sentry/svelte';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV
})

export const handleError: HandleClientError = (async ({ error, event }) => {
    const errorId = crypto.randomUUID();

    Sentry.withScope(async (scope) => {
        scope.setExtra('event', event);
        scope.setExtra('errorId', errorId);

        Sentry.captureException(error);
    })

    return {
        message: 'Whoops!',
        errorId
    };
}) satisfies HandleClientError;