import type { HandleClientError } from "@sveltejs/kit";

export const handleError: HandleClientError = (async ({ error, event }) => {
    const errorId = crypto.randomUUID();

    let errorResponse = {
        message: 'Whoops!',
        event,
        error,
        errorId
    };

    return errorResponse;
}) satisfies HandleClientError;