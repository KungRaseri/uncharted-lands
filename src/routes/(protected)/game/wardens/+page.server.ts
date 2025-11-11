import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
    // Placeholder - will implement warden system later
    return {
        wardens: [],
        defenseLevel: 0,
        threatLevel: 'unknown'
    };
}) satisfies PageServerLoad;
