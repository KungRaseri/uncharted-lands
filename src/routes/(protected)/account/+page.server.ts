import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

export const load: PageServerLoad = (async ({ locals, fetch }) => {
    if (!locals.account) {
        return fail(401, { unauthorized: true });
    }

    try {
        const response = await fetch(`${API_URL}/account/me`, {
            headers: {
                'Cookie': `session=${locals.account.userAuthToken}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                return fail(404, { notfound: true });
            }
            throw new Error(`API request failed: ${response.status}`);
        }

        const account = await response.json();

        return {
            account: account
        };
    } catch (error) {
        console.error('[ACCOUNT] Error fetching account from API:', error);
        return fail(500, { error: 'Failed to fetch account data' });
    }
}) 