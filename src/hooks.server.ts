import { redirect, type Handle, type HandleServerError } from "@sveltejs/kit";
import { AuthenticateUser } from "$lib/auth";
import * as Sentry from '@sentry/svelte';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV
})

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

    return await resolve(event);
}) satisfies Handle

export const handleError: HandleServerError = (async ({ error, event }) => {
    const errorId = crypto.randomUUID();

    Sentry.withScope(async (scope) => {
        scope.setExtra('event', event);
        scope.setExtra('errorId', errorId);

        Sentry.captureException(error);
        console.log(error)
    })

    return {
        message: 'Whoops!',
        errorId
    };
}) satisfies HandleServerError;