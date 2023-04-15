import { redirect, type Hook, type Handle, type HandleServerError } from "@sveltejs/kit";
import { AuthenticateUser } from "$lib/auth";

import * as Sentry from '@sentry/node';
import { BrowserTracing } from '@sentry/browser';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV
})

export const handleHook: Hook = (async ({ request, resolve }) => {

    return resolve(request);
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


    const response = await resolve(event);
    return response
}) satisfies Handle

export const handleError: HandleServerError = (async ({ error, event }) => {
    const errorId = crypto.randomUUID();

    Sentry.withScope(async (scope) => {
        scope.setExtra('event', event);
        scope.setExtra('errorId', errorId);

        Sentry.captureException(error, {
            contexts: { sveltekit: { event, errorId } }
        });
    })

    return {
        message: 'Whoops!',
        errorId
    };
}) satisfies HandleServerError;