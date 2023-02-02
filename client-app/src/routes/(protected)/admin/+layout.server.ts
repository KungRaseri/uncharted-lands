import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals }) => {
    if (!locals.account) {
        throw redirect(307, '/login')
    }

    return {};
}) satisfies LayoutServerLoad;