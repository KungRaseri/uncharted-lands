import type { Handle } from "@sveltejs/kit";


export const handle: Handle = async function ({ event, resolve }) {
    // const cookies = cookie.parse(event.request.headers.get("cookie") || "");

    const response = await resolve(event);
    return response;
}

export const getSession = async function (request: any) {
    console.log(request)
    return {
        user: {
            id: "test",
            name: "test name"
        }
    }
}