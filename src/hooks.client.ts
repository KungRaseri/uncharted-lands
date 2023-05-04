import type { HandleClientError } from "@sveltejs/kit";
import * as Sentry from '@sentry/svelte';

Sentry.init({
    dsn: "https://f9090c82f625466fa6f91eff48e20c32@o4504635308638208.ingest.sentry.io/4504635311915008",
    integrations: [],
    tracesSampleRate: 1.0,
    environment: "CLIENT"
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