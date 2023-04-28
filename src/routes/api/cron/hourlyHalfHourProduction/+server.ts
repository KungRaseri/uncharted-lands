import { db } from '$lib/db'
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
    
    return new Response("ok");
};