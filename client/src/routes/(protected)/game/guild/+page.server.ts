import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	// Placeholder - will implement guild system later
	return {
		guild: null,
		members: [],
		isLeader: false
	};
}) satisfies PageServerLoad;
