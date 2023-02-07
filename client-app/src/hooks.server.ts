import { redirect, type Handle, type HandleServerError } from "@sveltejs/kit";
import { AuthenticateUser } from "$lib/auth";
import * as Sentry from '@sentry/svelte';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
    dsn: "https://f9090c82f625466fa6f91eff48e20c32@o4504635308638208.ingest.sentry.io/4504635311915008",
    integrations: [new BrowserTracing()],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV
})

export const handle: Handle = async function ({ event, resolve }) {

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
}

export const handleError: HandleServerError = async ({ error, event }) => {
    const errorId = crypto.randomUUID();

    Sentry.withScope(async (scope) => {
        scope.setExtra('event', event);
        scope.setExtra('errorId', errorId);

        Sentry.captureException(error);
    })
}