import type { HandleClientError } from "@sveltejs/kit";
import * as Sentry from '@sentry/svelte';

Sentry.init({
    dsn: "https://f9090c82f625466fa6f91eff48e20c32@o4504635308638208.ingest.sentry.io/4504635311915008",
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1,
    environment: "CLIENT"
})

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
    })

    return {
        message: 'Whoops!',
        errorId
    };
}) satisfies HandleClientError;