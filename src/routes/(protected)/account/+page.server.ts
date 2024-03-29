import { db } from '$lib/db';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = (async ({ locals }) => {
    const account = await db.account.findUnique({
        where: {
            id: locals.account.id
        },
        include: {
            profile: true
        }
    })

    if (!account) {
        return fail(404, { notfound: true })
    }

    account.passwordHash = '';

    return {
        account: account
    };
}) 