import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	// Placeholder - will implement activity history system later
	return {
		activities: [],
		totalCount: 0
	};
}) satisfies PageServerLoad;
