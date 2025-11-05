import { redirect, type Handle, type HandleServerError } from "@sveltejs/kit";
import { AuthenticateUser } from "$lib/auth";
import * as Sentry from '@sentry/node';
import { initializeDevScheduler } from "$lib/server/scheduler";

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV
})

// Initialize development cron scheduler (only runs in dev mode)
initializeDevScheduler();

export const handle: Handle = (async ({ event, resolve }) => {
    const user = await AuthenticateUser(event.cookies);

    if (!user) {
        if (event.route.id?.includes('(protected)'))
            throw redirect(307, `/sign-in?redirectTo=${event.url.pathname}`)

    } else {
        if (user && user.role !== "ADMINISTRATOR" && event.route.id?.includes('(protected)/admin'))
            throw redirect(307, `/sign-in?redirectTo=${event.url.pathname}`)

        event.locals.account = user;
    }

    const response = await resolve(event);
    return response
}) satisfies Handle

export const handleError: HandleServerError = (async ({ error, event }) => {
    const errorId = crypto.randomUUID();

    // Comprehensive error logging
    console.error('\n========================================');
    console.error('🚨 SERVER ERROR:', errorId);
    console.error('========================================');
    console.error('URL:', event.url.pathname);
    console.error('Route:', event.route.id);
    console.error('Method:', event.request.method);
    console.error('Error:', error);
    
    if (error instanceof Error) {
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
    }
    
    console.error('Event details:', {
        url: event.url.href,
        params: event.params,
        locals: event.locals.account ? {
            id: event.locals.account.id,
            email: event.locals.account.email,
            role: event.locals.account.role
        } : 'No account'
    });
    console.error('========================================\n');

    Sentry.withScope((scope) => {
        scope.setTag("errorId", errorId)
        Sentry.captureException(error);
    })

    return {
        message: `${event.url.search} at ${event.url.pathname} failed.`,
        errorId
    };
}) satisfies HandleServerError;